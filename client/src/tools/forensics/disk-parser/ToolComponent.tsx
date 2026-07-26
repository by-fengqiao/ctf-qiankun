import AsyncTool from '../../_shared/AsyncTool';
import { readFileAsHex } from '../../_shared/inputUtils';
import { parseHex, bytesToText, readU32LE } from '../../_shared/hexUtils';
import type { ToolProps } from '../../types';

/* ---------- Partition type names ---------- */

const PART_TYPES: Record<number, string> = {
  0x00: '空',
  0x01: 'FAT12',
  0x04: 'FAT16 (<32M)',
  0x05: '扩展分区',
  0x06: 'FAT16',
  0x07: 'NTFS/exFAT',
  0x0B: 'FAT32',
  0x0C: 'FAT32 (LBA)',
  0x0E: 'FAT16 (LBA)',
  0x0F: '扩展分区 (LBA)',
  0x16: '隐藏 FAT16',
  0x17: '隐藏 NTFS',
  0x1B: '隐藏 FAT32',
  0x82: 'Linux Swap',
  0x83: 'Linux',
  0x8E: 'Linux LVM',
  0xA5: 'FreeBSD',
  0xA6: 'OpenBSD',
  0xA8: 'macOS UFS',
  0xA9: 'NetBSD',
  0xAF: 'HFS/HFS+',
  0xEE: 'GPT 保护分区',
  0xEF: 'EFI 系统分区',
  0xFD: 'Linux RAID',
};

function partTypeName(type: number): string {
  return PART_TYPES[type] ?? `未知 (0x${type.toString(16).toUpperCase().padStart(2, '0')})`;
}

/* ---------- MBR partition entry ---------- */

interface MbrEntry {
  index: number;
  active: boolean;
  type: number;
  typeName: string;
  startLBA: number;
  sectors: number;
  sizeMB: string;
}

function parseMbr(data: Uint8Array): MbrEntry[] {
  const entries: MbrEntry[] = [];
  const base = 0x1be;
  for (let i = 0; i < 4; i++) {
    const off = base + i * 16;
    const status = data[off];
    const type = data[off + 4];
    if (type === 0x00) continue;
    const startLBA = readU32LE(data, off + 8);
    const sectors = readU32LE(data, off + 12);
    const sizeBytes = sectors * 512;
    const sizeMB = sectors > 0 ? (sizeBytes / (1024 * 1024)).toFixed(2) : '0';
    entries.push({
      index: i + 1,
      active: (status & 0x80) !== 0,
      type,
      typeName: partTypeName(type),
      startLBA,
      sectors,
      sizeMB: sizeMB + ' MB',
    });
  }
  return entries;
}

/* ---------- GPT ---------- */

interface GptEntry {
  index: number;
  typeGuid: string;
  name: string;
  startLBA: number;
  endLBA: number;
  sizeMB: string;
}

function parseGuid(data: Uint8Array, off: number): string {
  if (off + 16 > data.length) return '?';
  const d0 = readU32LE(data, off);
  const d1 = (data[off + 4] | (data[off + 5] << 8)).toString(16).padStart(4, '0');
  const d2 = (data[off + 6] | (data[off + 7] << 8)).toString(16).padStart(4, '0');
  const d3 = [data[off + 8], data[off + 9]].map((b: number) => b.toString(16).padStart(2, '0')).join('');
  const d4 = [data[off + 10], data[off + 11], data[off + 12], data[off + 13], data[off + 14], data[off + 15]]
    .map((b: number) => b.toString(16).padStart(2, '0')).join('');
  return `${d0.toString(16).padStart(8, '0')}-${d1}-${d2}-${d3}-${d4}`;
}

const KNOWN_GPT_TYPES: Record<string, string> = {
  '0fc63daf-4817-4c3d-8e4d-d3a4a7b1d6e7': 'Linux filesystem',
  'e3c9e316-0b5c-4db8-817d-f92df00215ae': 'Microsoft reserved',
  'ebd0a0a2-b9e5-4433-87c0-68b6b72699c7': 'Microsoft basic data (NTFS)',
  'c12a7328-f81f-11d2-ba4b-00a0c93ec93b': 'EFI System Partition',
  '21686148-6449-6e6f-744e-656564454649': 'BIOS boot partition',
  '0657fd6d-a4ab-43c4-84e5-0933c84b4f4f': 'Linux swap',
};

function parseGpt(data: Uint8Array, gptLba1: number): { entries: GptEntry[]; valid: boolean } {
  if (gptLba1 + 92 > data.length) return { entries: [], valid: false };
  const sig = bytesToText(data.subarray(gptLba1, gptLba1 + 8));
  if (sig !== 'EFI PART') return { entries: [], valid: false };

  const entryStartLBA = readU32LE(data, gptLba1 + 72);
  const numEntries = readU32LE(data, gptLba1 + 80);
  const entrySize = readU32LE(data, gptLba1 + 84);

  const entries: GptEntry[] = [];
  const maxEntries = Math.min(numEntries, 128);
  for (let i = 0; i < maxEntries; i++) {
    const off = entryStartLBA * 512 + i * entrySize;
    if (off + 56 > data.length) break;
    const typeGuid = parseGuid(data, off);
    if (typeGuid === '00000000-0000-0000-0000-000000000000') continue;

    const startLBA = Number(BigInt(readU32LE(data, off + 32)) | (BigInt(readU32LE(data, off + 36)) << 32n));
    const endLBA = Number(BigInt(readU32LE(data, off + 40)) | (BigInt(readU32LE(data, off + 44)) << 32n));
    const sectors = endLBA - startLBA + 1;
    const sizeMB = (sectors * 512 / (1024 * 1024)).toFixed(2);

    let name = '';
    const nameOff = off + 56;
    for (let j = 0; j < 36 && nameOff + j * 2 + 1 < data.length; j++) {
      const ch = data[nameOff + j * 2] | (data[nameOff + j * 2 + 1] << 8);
      if (ch === 0) break;
      name += String.fromCharCode(ch);
    }

    const typeName = KNOWN_GPT_TYPES[typeGuid] ?? typeGuid;
    entries.push({ index: entries.length + 1, typeGuid: typeName, name, startLBA, endLBA, sizeMB: sizeMB + ' MB' });
  }
  return { entries, valid: true };
}

/* ---------- Main parse ---------- */

const parse = (bytes: Uint8Array): string => {
  if (bytes.length < 512) throw new Error('数据过短，至少需要 512 字节 (1 扇区)');
  const L: string[] = [];
  L.push('═══════════════════════════════════════════');
  L.push('  磁盘镜像分区解析报告');
  L.push('═══════════════════════════════════════════');
  L.push('');
  L.push(`  数据大小: ${bytes.length} 字节 (${(bytes.length / 1024 / 1024).toFixed(2)} MB)`);
  L.push('');

  /* --- MBR --- */
  L.push('── MBR 分区表 (偏移 0x1BE) ──');
  const mbrSig = (bytes[0x1fe] | (bytes[0x1ff] << 8));
  if (mbrSig === 0xaa55) {
    L.push(`  MBR 签名: 0xAA55 ✓`);
  } else {
    L.push(`  ⚠️ MBR 签名无效: 0x${mbrSig.toString(16).toUpperCase().padStart(4, '0')} (期望 0xAA55)`);
  }
  L.push('');

  const mbrEntries = parseMbr(bytes);
  if (mbrEntries.length === 0) {
    L.push('  无有效分区');
  } else {
    L.push('  # | 活动 | 类型            | 起始LBA     | 扇区数      | 大小');
    L.push('  ' + '─'.repeat(72));
    for (const e of mbrEntries) {
      const act = e.active ? '✓' : ' ';
      L.push(`  ${e.index} |  ${act}   | ${e.typeName.padEnd(15)} | ${String(e.startLBA).padStart(10)} | ${String(e.sectors).padStart(10)} | ${e.sizeMB}`);
    }
  }
  L.push('');

  /* --- GPT --- */
  const gptLba1 = 512;
  L.push('── GPT 头 (LBA 1) ──');
  if (gptLba1 + 8 <= bytes.length) {
    const gptSig = bytesToText(bytes.subarray(gptLba1, gptLba1 + 8));
    if (gptSig === 'EFI PART') {
      L.push(`  GPT 签名: "EFI PART" ✓`);
      const gpt = parseGpt(bytes, gptLba1);
      if (gpt.valid) {
        L.push(`  GPT 分区数: ${gpt.entries.length}`);
        L.push('');
        L.push('  # | 类型                              | 名称           | 起始LBA     | 结束LBA     | 大小');
        L.push('  ' + '─'.repeat(90));
        for (const e of gpt.entries) {
          L.push(`  ${e.index} | ${e.typeGuid.padEnd(33)} | ${e.name.padEnd(14)} | ${String(e.startLBA).padStart(10)} | ${String(e.endLBA).padStart(10)} | ${e.sizeMB}`);
        }
      }
    } else {
      const hex = Array.from(bytes.subarray(gptLba1, gptLba1 + 8))
        .map((b: number) => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
      L.push(`  未检测到 GPT (签名: ${hex})`);
    }
  } else {
    L.push('  数据不足以检测 GPT');
  }
  L.push('');

  /* --- Boot code --- */
  L.push('── 引导代码 (前 446 字节) ──');
  if (bytes[0] === 0xeb || bytes[0] === 0xe9) {
    L.push(`  检测到跳转指令: 0x${bytes[0].toString(16).toUpperCase()} (存在引导代码)`);
  } else {
    L.push(`  首字节: 0x${bytes[0].toString(16).toUpperCase().padStart(2, '0')} (可能无引导代码)`);
  }
  const diskSig = readU32LE(bytes, 0x1b8);
  L.push(`  磁盘签名: 0x${diskSig.toString(16).toUpperCase().padStart(8, '0')}`);

  return L.join('\n');
};

const ToolComponent = (props: ToolProps) => (
  <AsyncTool {...props} toolName="磁盘镜像分区解析"
    execute={async (input: string, _mode: string, _params: Record<string, unknown>, file: File | null) => {
      let hex = input;
      if (file) {
        hex = await readFileAsHex(file, 2 * 1024 * 1024);
        const noteIdx = hex.indexOf('\n');
        if (noteIdx >= 0) hex = hex.substring(0, noteIdx);
      }
      const bytes = parseHex(hex);
      return parse(bytes);
    }} />
);
export default ToolComponent;
