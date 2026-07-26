import AsyncTool from '../../_shared/AsyncTool';
import { readFileAsHex } from '../../_shared/inputUtils';
import { parseHex, readU32LE } from '../../_shared/hexUtils';
import type { ToolProps } from '../../types';

/* ---------- Helpers ---------- */

const EPOCH_OFFSET = 116444736000000000n;

function readU64LE(bytes: Uint8Array, offset: number): bigint {
  let val = 0n;
  for (let i = 7; i >= 0; i--) {
    val = (val << 8n) | BigInt(bytes[offset + i]);
  }
  return val;
}

function filetimeToISO(ft: bigint): string {
  if (ft === 0n) return '(无)';
  if (ft < EPOCH_OFFSET) return '(无效)';
  const unixMs = Number((ft - EPOCH_OFFSET) / 10000n);
  if (unixMs < 0 || unixMs > 20000000000000) return '(无效)';
  return new Date(unixMs).toISOString();
}

function readUTF16LE(bytes: Uint8Array, offset: number, charCount: number): string {
  const chars: string[] = [];
  for (let i = 0; i < charCount && offset + i * 2 + 1 < bytes.length; i++) {
    const lo = bytes[offset + i * 2];
    const hi = bytes[offset + i * 2 + 1];
    if (lo === 0 && hi === 0) break;
    chars.push(String.fromCharCode(lo | (hi << 8)));
  }
  return chars.join('');
}

/* ---------- $I file parser (Windows 10+) ---------- */

interface IFileRecord {
  version: number;
  fileSize: bigint;
  deletionTime: bigint;
  fileName: string;
  originalPath: string;
}

function parseDollarI(bytes: Uint8Array): IFileRecord {
  // Version: 8 bytes (1 = XP/Vista, 2 = Win10+)
  const version = readU32LE(bytes, 0);
  // File size: 8 bytes at offset 8
  const fileSize = readU64LE(bytes, 8);
  // Deletion time: 8 bytes FILETIME at offset 16
  const deletionTime = readU64LE(bytes, 16);
  // File name length: 4 bytes at offset 24 (in characters) for v2
  // File name: UTF-16LE starts at offset 28
  let nameLen = 0;
  let nameOffset = 0;
  if (version === 1) {
    // v1: name at offset 20, nul-terminated UTF-16LE
    nameOffset = 20;
    nameLen = 520; // max
  } else if (version === 2 || version === 3) {
    // v2/v3: 4-byte length at offset 24, name at offset 28
    nameLen = readU32LE(bytes, 24);
    nameOffset = 28;
  } else {
    // Unknown version, try v2 layout
    nameLen = readU32LE(bytes, 24);
    nameOffset = 28;
  }
  const rawName = readUTF16LE(bytes, nameOffset, nameLen);
  const fileName = rawName.replace(/\0.*$/, '').trim();
  // Original path is embedded in the filename for recycle bin records
  const originalPath = fileName;
  return { version, fileSize, deletionTime, fileName, originalPath };
}

/* ---------- INFO2 parser (Windows XP) ---------- */

interface Info2Record {
  recordNum: number;
  drive: string;
  recordIndex: number;
  deletionTime: bigint;
  fileSize: bigint;
  fileName: string;
}

function parseInfo2(bytes: Uint8Array): { records: Info2Record[]; headerSize: number } {
  // INFO2 header: 4 bytes version (5), 4 bytes record size (0x320), 4 bytes max records, 4 bytes next record
  if (bytes.length < 16) throw new Error('INFO2 文件过短');
  const version = readU32LE(bytes, 0);
  if (version !== 5) {
    // Could still be INFO2 with different version, but warn
  }
  const recordSize = readU32LE(bytes, 4);
  const headerSize = 16;
  const records: Info2Record[] = [];
  let offset = headerSize;
  let idx = 0;
  while (offset + recordSize <= bytes.length) {
    if (offset + recordSize > bytes.length) break;
    // Record: 4 bytes ASCII drive char at offset 0
    const driveByte = bytes[offset];
    const drive = driveByte !== 0 ? String.fromCharCode(driveByte) : '?';
    // Record index: 4 bytes at offset 4
    const recordIndex = readU32LE(bytes, offset + 4);
    // Deletion time: 8 bytes FILETIME at offset 8
    const deletionTime = readU64LE(bytes, offset + 8);
    // File size: 4 bytes at offset 16 (32-bit)
    const fileSize = BigInt(readU32LE(bytes, offset + 16) >>> 0);
    // File name: UTF-16LE at offset 20, up to 520 bytes (260 chars)
    const fileName = readUTF16LE(bytes, offset + 20, 260).replace(/\0.*$/, '').trim();
    if (driveByte !== 0 || fileName.length > 0) {
      records.push({
        recordNum: idx,
        drive: `${drive}:`,
        recordIndex,
        deletionTime,
        fileSize,
        fileName,
      });
    }
    idx++;
    offset += recordSize;
  }
  return { records, headerSize };
}

/* ---------- Main parse ---------- */

const parse = (bytes: Uint8Array): string => {
  if (bytes.length < 8) throw new Error('数据过短，无法解析');
  const L: string[] = [];
  L.push('═══════════════════════════════════════════');
  L.push('  回收站文件解析报告');
  L.push('═══════════════════════════════════════════');
  L.push('');

  // Detect format: $I file vs INFO2
  const version = readU32LE(bytes, 0);
  const isInfo2 = version === 5 && bytes.length >= 16 && readU32LE(bytes, 4) === 0x320;

  if (isInfo2) {
    L.push('格式: INFO2 (Windows XP)');
    L.push('');
    const { records } = parseInfo2(bytes);
    L.push(`记录数: ${records.length}`);
    L.push('');
    L.push('── 删除记录 ──');
    records.forEach((r: Info2Record, i: number) => {
      L.push(`[${i + 1}]`);
      L.push(`  原始路径: ${r.drive}\\${r.fileName}`);
      L.push(`  文件大小: ${r.fileSize.toString()} 字节`);
      L.push(`  删除时间: ${filetimeToISO(r.deletionTime)}`);
      L.push(`  记录索引: ${r.recordIndex}`);
      L.push('');
    });
  } else {
    // Treat as $I file
    L.push(`格式: $I 文件 (Windows ${version === 1 ? 'Vista/XP' : version === 2 ? '10+' : '未知 v' + version})`);
    L.push('');
    const rec = parseDollarI(bytes);
    L.push('── 文件头 ──');
    L.push(`  版本: ${rec.version}`);
    L.push(`  文件大小: ${rec.fileSize.toString()} 字节`);
    L.push(`  删除时间: ${filetimeToISO(rec.deletionTime)}`);
    L.push('');
    L.push('── 文件信息 ──');
    L.push(`  文件名: ${rec.fileName || '(空)'}`);
    L.push(`  原始路径: ${rec.originalPath || '(未知)'}`);
  }
  L.push('');
  L.push('── 备注 ──');
  L.push('  $I 文件: Win10+ 回收站记录，位于 $Recycle.Bin\\<SID>\\$I*.xxx');
  L.push('  INFO2: Win XP 回收站记录，位于 RECYCLER\\<SID>\\INFO2');
  return L.join('\n');
};

const ToolComponent = (props: ToolProps) => (
  <AsyncTool {...props} toolName="回收站文件解析"
    execute={async (input: string, _mode: string, _params: Record<string, unknown>, file: File | null) => {
      let hex = input;
      if (file) {
        hex = await readFileAsHex(file, 256 * 1024);
        const noteIdx = hex.indexOf('\n');
        if (noteIdx >= 0) hex = hex.substring(0, noteIdx);
      }
      const bytes = parseHex(hex);
      return parse(bytes);
    }} />
);
export default ToolComponent;
