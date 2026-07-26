import AsyncTool from '../../_shared/AsyncTool';
import { readFileAsHex } from '../../_shared/inputUtils';
import { parseHex, readU16LE, readU32LE, bytesToText } from '../../_shared/hexUtils';
import type { ToolProps } from '../../types';

const OLE_MAGIC = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1];

const ENDOFCHAIN = 0xfffffffe;
const FREESECT = 0xffffffff;

interface DirEntry {
  name: string;
  type: number;
  color: number;
  leftSibling: number;
  rightSibling: number;
  child: number;
  startSector: number;
  streamSize: number;
  index: number;
}

function readU64LE(bytes: Uint8Array, offset: number): bigint {
  let val = 0n;
  for (let i = 7; i >= 0; i--) {
    val = (val << 8n) | BigInt(bytes[offset + i]);
  }
  return val;
}

function decodeUTF16LE(bytes: Uint8Array, byteLength: number): string {
  const chars: string[] = [];
  const charCount = Math.floor(byteLength / 2);
  for (let i = 0; i < charCount; i++) {
    const lo = bytes[i * 2];
    const hi = bytes[i * 2 + 1];
    if (lo === 0 && hi === 0) break;
    chars.push(String.fromCharCode(lo | (hi << 8)));
  }
  return chars.join('');
}

const parse = (bytes: Uint8Array): string => {
  if (bytes.length < 512) {
    throw new Error('数据过短，无法解析 OLE 文件（至少需要 512 字节头部）');
  }

  for (let i = 0; i < OLE_MAGIC.length; i++) {
    if (bytes[i] !== OLE_MAGIC[i]) {
      throw new Error('无效的 OLE 签名（期望 D0CF11E0A1B11AE1）');
    }
  }

  const L: string[] = [];
  L.push('═══════════════════════════════════════════');
  L.push('  OLE2 复合文档解析报告');
  L.push('═══════════════════════════════════════════');
  L.push('');

  const sectorSizePower = readU16LE(bytes, 30);
  const sectorSize = 1 << sectorSizePower;
  const miniSectorSizePower = readU16LE(bytes, 32);
  const miniSectorSize = 1 << miniSectorSizePower;
  const totalFATSectors = readU32LE(bytes, 44) >>> 0;
  const firstDirSector = readU32LE(bytes, 48) >>> 0;
  const miniStreamCutoff = readU32LE(bytes, 56);
  const firstMiniFATSector = readU32LE(bytes, 60) >>> 0;
  const totalMiniFATSectors = readU32LE(bytes, 64);
  const firstDIFATSector = readU32LE(bytes, 68) >>> 0;
  const totalDIFATSectors = readU32LE(bytes, 72);

  L.push('── 文件头 ──');
  L.push(`  签名: D0 CF 11 E0 A1 B1 1A E1 ✓`);
  L.push(`  扇区大小: ${sectorSize} 字节 (2^${sectorSizePower})`);
  L.push(`  小扇区大小: ${miniSectorSize} 字节 (2^${miniSectorSizePower})`);
  L.push(`  FAT 扇区数: ${totalFATSectors}`);
  L.push(`  首个目录扇区: ${firstDirSector}`);
  L.push(`  小流截止大小: ${miniStreamCutoff} 字节`);
  L.push(`  首个 Mini FAT 扇区: ${firstMiniFATSector === ENDOFCHAIN ? '无' : firstMiniFATSector}`);
  L.push(`  Mini FAT 扇区数: ${totalMiniFATSectors}`);
  L.push(`  首个 DIFAT 扇区: ${firstDIFATSector === ENDOFCHAIN ? '无' : firstDIFATSector}`);
  L.push(`  DIFAT 扇区数: ${totalDIFATSectors}`);
  L.push('');

  const difat: number[] = [];
  for (let i = 0; i < 109; i++) {
    const off = 76 + i * 4;
    if (off + 4 > bytes.length) break;
    const val = readU32LE(bytes, off) >>> 0;
    if (val !== FREESECT && val < 0xfffffffc) difat.push(val);
  }

  let nextDIFAT = firstDIFATSector;
  while (nextDIFAT !== ENDOFCHAIN && nextDIFAT !== FREESECT && nextDIFAT < 0xfffffffc) {
    const off = 512 + nextDIFAT * sectorSize;
    if (off + sectorSize > bytes.length) break;
    const entriesInSector = Math.floor((sectorSize - 4) / 4);
    for (let i = 0; i < entriesInSector; i++) {
      const val = readU32LE(bytes, off + i * 4) >>> 0;
      if (val !== FREESECT && val < 0xfffffffc) difat.push(val);
    }
    nextDIFAT = readU32LE(bytes, off + sectorSize - 4) >>> 0;
  }

  const fat: number[] = [];
  for (const fatSector of difat) {
    const off = 512 + fatSector * sectorSize;
    if (off + sectorSize > bytes.length) break;
    for (let i = 0; i < sectorSize / 4; i++) {
      fat.push(readU32LE(bytes, off + i * 4) >>> 0);
    }
  }

  const readSectorChain = (startSector: number): number[] => {
    const chain: number[] = [];
    let sector = startSector;
    const visited = new Set<number>();
    while (sector !== ENDOFCHAIN && sector !== FREESECT && sector < 0xfffffffc) {
      if (visited.has(sector)) break;
      visited.add(sector);
      if (sector >= fat.length) break;
      chain.push(sector);
      sector = fat[sector];
    }
    return chain;
  };

  const dirChain = readSectorChain(firstDirSector);
  const dirData = new Uint8Array(dirChain.length * sectorSize);
  let dirPos = 0;
  for (const sector of dirChain) {
    const off = 512 + sector * sectorSize;
    if (off + sectorSize > bytes.length) break;
    for (let i = 0; i < sectorSize && dirPos < dirData.length; i++) {
      dirData[dirPos++] = bytes[off + i];
    }
  }

  const entries: DirEntry[] = [];
  const numEntries = Math.floor(dirData.length / 128);
  for (let i = 0; i < numEntries; i++) {
    const off = i * 128;
    const nameLen = readU16LE(dirData, off + 64);
    if (nameLen === 0 || nameLen > 64) continue;
    const objType = dirData[off + 66];
    const color = dirData[off + 67];
    const leftSibling = readU32LE(dirData, off + 68) >>> 0;
    const rightSibling = readU32LE(dirData, off + 72) >>> 0;
    const child = readU32LE(dirData, off + 76) >>> 0;
    const startSector = readU32LE(dirData, off + 116) >>> 0;
    const streamSize = Number(readU64LE(dirData, off + 120));
    const name = decodeUTF16LE(dirData.subarray(off), nameLen - 2);
    entries.push({ name, type: objType, color, leftSibling, rightSibling, child, startSector, streamSize, index: i });
  }

  L.push(`── 目录条目 (${entries.length} 个) ──`);
  const typeNames: Record<number, string> = { 0: '空', 1: 'Storage', 2: 'Stream', 5: 'Root' };
  for (const e of entries) {
    const typeName = typeNames[e.type] ?? `Type${e.type}`;
    if (e.type === 5) {
      L.push(`  [${e.index}] ${e.name || '(Root)'} (${typeName})`);
    } else if (e.type === 2) {
      L.push(`  [${e.index}] ${e.name || '(unnamed)'} (${typeName}, ${e.streamSize} 字节, 扇区 ${e.startSector})`);
    } else if (e.type === 1) {
      L.push(`  [${e.index}] ${e.name || '(unnamed)'} (${typeName})`);
    }
  }
  L.push('');

  L.push('── 文档类型识别 ──');
  const streamNames = new Set(entries.map((e: DirEntry) => e.name));
  if (streamNames.has('WordDocument')) {
    L.push('  ✓ Microsoft Word 文档 (.doc)');
  }
  if (streamNames.has('Workbook')) {
    L.push('  ✓ Microsoft Excel 工作簿 (.xls)');
  }
  if (streamNames.has('PowerPoint Document')) {
    L.push('  ✓ Microsoft PowerPoint 演示文稿 (.ppt)');
  }
  if (!streamNames.has('WordDocument') && !streamNames.has('Workbook') && !streamNames.has('PowerPoint Document')) {
    L.push('  (未识别为标准 Office 文档)');
  }
  L.push('');

  L.push('── VBA 宏检测 ──');
  const vbaStreams = entries.filter((e: DirEntry) =>
    e.name === 'VBA' || e.name === '_VBA_PROJECT' || e.name === 'PROJECT' || e.name === 'PROJECTwm' ||
    e.name.includes('Macros') || e.name.includes('VBA')
  );
  if (vbaStreams.length > 0) {
    L.push(`  ⚠️ 检测到 VBA 宏相关流 (${vbaStreams.length} 个):`);
    for (const v of vbaStreams) {
      L.push(`    • ${v.name} (${v.streamSize} 字节)`);
    }
  } else {
    L.push('  未检测到 VBA 宏相关流');
  }
  const rawText = bytesToText(bytes);
  if (rawText.includes('VBA') || rawText.includes('_VBA_PROJECT')) {
    L.push('  (原始数据中发现 VBA/_VBA_PROJECT 标记)');
  }
  L.push('');

  L.push('── 嵌入对象检测 ──');
  const oleObjStreams = entries.filter((e: DirEntry) =>
    e.name.startsWith('\u0001Ole') || e.name.includes('OlePres') || e.name.includes('CONTENTS')
  );
  if (oleObjStreams.length > 0) {
    L.push(`  检测到嵌入对象相关流 (${oleObjStreams.length} 个):`);
    for (const v of oleObjStreams.slice(0, 20)) {
      L.push(`    • ${v.name.replace(/\u0001/g, '\\\\x01')} (${v.streamSize} 字节)`);
    }
  } else {
    L.push('  未检测到嵌入对象相关流');
  }
  L.push('');

  L.push(`文件大小: ${bytes.length} 字节`);
  L.push(`FAT 条目数: ${fat.length}`);

  return L.join('\n');
};

const ToolComponent = (props: ToolProps) => (
  <AsyncTool {...props} toolName="OLE/Office文件解析"
    execute={async (input: string, _mode: string, _params: Record<string, unknown>, file: File | null) => {
      let hex = input;
      if (file) {
        hex = await readFileAsHex(file, 512 * 1024);
        const noteIdx = hex.indexOf('\\n');
        if (noteIdx >= 0) hex = hex.substring(0, noteIdx);
      }
      const bytes = parseHex(hex);
      return parse(bytes);
    }} />
);
export default ToolComponent;
