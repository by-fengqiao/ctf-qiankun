import AsyncTool from '../../_shared/AsyncTool';
import { readFileAsHex } from '../../_shared/inputUtils';
import { parseHex, readU16LE, readU32LE } from '../../_shared/hexUtils';
import type { ToolProps } from '../../types';

/* ---------- Constants ---------- */

const EPOCH_OFFSET = 116444736000000000n;

const ATTR_NAMES: Record<number, string> = {
  0x10: '$STANDARD_INFORMATION',
  0x20: '$ATTRIBUTE_LIST',
  0x30: '$FILE_NAME',
  0x40: '$OBJECT_ID',
  0x50: '$SECURITY_DESCRIPTOR',
  0x60: '$VOLUME_NAME',
  0x70: '$VOLUME_INFORMATION',
  0x80: '$DATA',
  0x90: '$INDEX_ROOT',
  0xA0: '$INDEX_ALLOCATION',
  0xB0: '$BITMAP',
  0xC0: '$REPARSE_POINT',
  0xD0: '$EA_INFORMATION',
  0xE0: '$EA',
  0xFFFFFFFF: '$END',
};

const NAMESPACE_NAMES: Record<number, string> = {
  0: 'POSIX',
  1: 'Win32',
  2: 'DOS',
  3: 'Win32&DOS',
};

/* ---------- Helpers ---------- */

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

function applyUSA(bytes: Uint8Array, usaOffset: number, usaCount: number): Uint8Array {
  if (usaCount < 2) return bytes;
  const fixed = new Uint8Array(bytes.length);
  fixed.set(bytes);
  const usaValue = readU16LE(fixed, usaOffset);
  for (let i = 1; i < usaCount; i++) {
    const sectorEnd = (i - 1) * 512 + 510;
    if (sectorEnd + 1 >= fixed.length) break;
    const currentVal = fixed[sectorEnd] | (fixed[sectorEnd + 1] << 8);
    if (currentVal === usaValue) {
      const replacement = readU16LE(fixed, usaOffset + i * 2);
      fixed[sectorEnd] = replacement & 0xFF;
      fixed[sectorEnd + 1] = (replacement >> 8) & 0xFF;
    }
  }
  return fixed;
}

interface MftAttr {
  type: number;
  length: number;
  nonResident: number;
  attrId: number;
  contentLength: number;
  contentOffset: number;
  realSize: bigint;
  attrOffset: number;
}

function parseAttributes(data: Uint8Array, start: number, end: number): MftAttr[] {
  const attrs: MftAttr[] = [];
  let offset = start;
  while (offset + 16 <= end) {
    const type = readU32LE(data, offset) >>> 0;
    if (type === 0xFFFFFFFF) break;
    const length = readU32LE(data, offset + 4) >>> 0;
    if (length < 16 || offset + length > end) break;

    const nonResident = data[offset + 8];
    const attrId = readU16LE(data, offset + 14);

    let contentLength = 0;
    let contentOffset = 0;
    let realSize = 0n;

    if (nonResident === 0) {
      contentLength = readU32LE(data, offset + 16) >>> 0;
      contentOffset = readU16LE(data, offset + 20);
    } else {
      realSize = readU64LE(data, offset + 48);
    }

    attrs.push({ type, length, nonResident, attrId, contentLength, contentOffset, realSize, attrOffset: offset });
    offset += length;
  }
  return attrs;
}

/* ---------- Main parse ---------- */

const parse = (bytes: Uint8Array): string => {
  if (bytes.length < 48) throw new Error('数据过短，无法解析 MFT 记录');

  const L: string[] = [];
  L.push('═══════════════════════════════════════════');
  L.push('  $MFT 记录解析报告');
  L.push('═══════════════════════════════════════════');
  L.push('');

  const isFile = bytes[0] === 0x46 && bytes[1] === 0x49 && bytes[2] === 0x4C && bytes[3] === 0x45;
  const isBaad = bytes[0] === 0x42 && bytes[1] === 0x41 && bytes[2] === 0x41 && bytes[3] === 0x44;
  if (!isFile && !isBaad) {
    const sigHex = [bytes[0], bytes[1], bytes[2], bytes[3]]
      .map((b: number) => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
    throw new Error(`无效的 MFT 签名: ${sigHex} (期望 46494C45 "FILE")`);
  }

  const sigStr = isFile ? 'FILE' : 'BAAD';
  const usaOffset = readU16LE(bytes, 4);
  const usaCount = readU16LE(bytes, 6);
  const lsn = readU64LE(bytes, 8);
  const seqNumber = readU16LE(bytes, 16);
  const hardLinkCount = readU16LE(bytes, 18);
  const firstAttrOffset = readU16LE(bytes, 20);
  const flags = readU16LE(bytes, 22);
  const usedSize = readU32LE(bytes, 24) >>> 0;
  const allocSize = readU32LE(bytes, 28) >>> 0;

  L.push('── 记录头 ──');
  L.push(`  签名: ${sigStr} ${isFile ? '✓' : '(损坏)'}`);
  L.push(`  $LSN: 0x${lsn.toString(16).toUpperCase()}`);
  L.push(`  序列号: ${seqNumber}`);
  L.push(`  硬链接数: ${hardLinkCount}`);
  L.push(`  标志: 0x${flags.toString(16).padStart(4, '0').toUpperCase()}` +
    ` (${(flags & 1) ? 'InUse' : 'Free'}${(flags & 2) ? ', Directory' : ''})`);
  L.push(`  已用大小: ${usedSize} / ${allocSize} 字节`);
  L.push('');

  const data = applyUSA(bytes, usaOffset, usaCount);
  const attrs = parseAttributes(data, firstAttrOffset, usedSize);

  L.push(`── 属性列表 (${attrs.length} 个) ──`);
  attrs.forEach((a: MftAttr) => {
    const name = ATTR_NAMES[a.type] ?? `0x${a.type.toString(16).toUpperCase()}`;
    const res = a.nonResident === 0 ? 'Resident' : 'NonResident';
    L.push(`  ${name} (${res})`);
  });
  L.push('');

  const siAttr = attrs.find((a: MftAttr) => a.type === 0x10);
  if (siAttr && siAttr.nonResident === 0) {
    const cOff = siAttr.attrOffset + siAttr.contentOffset;
    L.push('── $STANDARD_INFORMATION ──');
    if (cOff + 32 <= data.length) {
      const creation = readU64LE(data, cOff);
      const modified = readU64LE(data, cOff + 8);
      const mftModified = readU64LE(data, cOff + 16);
      const accessed = readU64LE(data, cOff + 24);
      L.push('  MACE 时间戳:');
      L.push(`    Modified:  ${filetimeToISO(modified)}`);
      L.push(`    Accessed:  ${filetimeToISO(accessed)}`);
      L.push(`    Changed:   ${filetimeToISO(mftModified)}`);
      L.push(`    Birth:     ${filetimeToISO(creation)}`);
    }
    L.push('');
  }

  const fnAttr = attrs.find((a: MftAttr) => a.type === 0x30);
  if (fnAttr && fnAttr.nonResident === 0) {
    const cOff = fnAttr.attrOffset + fnAttr.contentOffset;
    L.push('── $FILE_NAME ──');
    if (cOff + 66 <= data.length) {
      const parentRef = readU64LE(data, cOff);
      const parentRecord = Number(parentRef & 0xFFFFFFFFFFFFn);
      const allocSize = readU64LE(data, cOff + 40);
      const realSize = readU64LE(data, cOff + 48);
      const nameLen = data[cOff + 64];
      const namespace = data[cOff + 65];
      const nameChars: string[] = [];
      for (let i = 0; i < nameLen && cOff + 66 + i * 2 + 1 < data.length; i++) {
        const lo = data[cOff + 66 + i * 2];
        const hi = data[cOff + 66 + i * 2 + 1];
        nameChars.push(String.fromCharCode(lo | (hi << 8)));
      }
      const fileName = nameChars.join('');
      L.push(`  文件名: ${fileName || '(无)'}`);
      L.push(`  命名空间: ${NAMESPACE_NAMES[namespace] ?? namespace}`);
      L.push(`  父目录引用: 0x${parentRecord.toString(16).toUpperCase()}`);
      L.push(`  分配大小: ${allocSize} 字节`);
      L.push(`  实际大小: ${realSize} 字节`);
    }
    L.push('');
  }

  const dataAttr = attrs.find((a: MftAttr) => a.type === 0x80);
  if (dataAttr) {
    L.push('── $DATA ──');
    if (dataAttr.nonResident === 0) {
      L.push(`  属性类型: Resident`);
      L.push(`  数据大小: ${dataAttr.contentLength} 字节`);
    } else {
      L.push(`  属性类型: Non-Resident`);
      L.push(`  实际大小: ${dataAttr.realSize} 字节`);
    }
    L.push('');
  }

  return L.join('\n');
};

const ToolComponent = (props: ToolProps) => (
  <AsyncTool {...props} toolName="$MFT解析"
    execute={async (input: string, _mode: string, _params: Record<string, unknown>, file: File | null) => {
      let hex = input;
      if (file) {
        hex = await readFileAsHex(file, 512 * 1024);
        const noteIdx = hex.indexOf('\n');
        if (noteIdx >= 0) hex = hex.substring(0, noteIdx);
      }
      const bytes = parseHex(hex);
      return parse(bytes);
    }} />
);
export default ToolComponent;
