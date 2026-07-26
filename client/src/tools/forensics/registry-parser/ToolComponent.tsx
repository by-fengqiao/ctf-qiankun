import AsyncTool from '../../_shared/AsyncTool';
import { readFileAsHex } from '../../_shared/inputUtils';
import { parseHex, bytesToText, readU16LE } from '../../_shared/hexUtils';
import type { ToolProps } from '../../types';

/* ---------- Constants ---------- */

const HBIN_START = 0x1000;
const EPOCH_OFFSET = 116444736000000000n;
const MAX_DEPTH = 3;
const MAX_SUBKEYS_PER_NODE = 50;
const MAX_VALUES_PER_NODE = 30;

const VALUE_TYPES: Record<number, string> = {
  0: 'REG_NONE',
  1: 'REG_SZ',
  2: 'REG_EXPAND_SZ',
  3: 'REG_BINARY',
  4: 'REG_DWORD',
  5: 'REG_DWORD_BE',
  6: 'REG_LINK',
  7: 'REG_MULTI_SZ',
  8: 'REG_RESOURCE_LIST',
  9: 'REG_FULL_RESOURCE_DESC',
  10: 'REG_RESOURCE_REQUIREMENTS',
  11: 'REG_QWORD',
};

/* ---------- Helpers ---------- */

function u32LE(b: Uint8Array, o: number): number {
  return (readU16LE(b, o) | (readU16LE(b, o + 2) << 16)) >>> 0;
}

function readU64LE(b: Uint8Array, o: number): bigint {
  let v = 0n;
  for (let i = 7; i >= 0; i--) v = (v << 8n) | BigInt(b[o + i]);
  return v;
}

function filetimeToISO(ft: bigint): string {
  if (ft === 0n) return '(无)';
  if (ft < EPOCH_OFFSET) return '(无效)';
  const unixMs = Number((ft - EPOCH_OFFSET) / 10000n);
  if (unixMs < 0 || unixMs > 20000000000000) return '(无效)';
  return new Date(unixMs).toISOString();
}

function relToAbs(rel: number): number {
  return HBIN_START + rel;
}

function readName(data: Uint8Array, off: number, len: number, ascii: boolean): string {
  if (len <= 0 || off + len > data.length) return '';
  if (ascii) {
    return bytesToText(data.subarray(off, off + len));
  }
  let s = '';
  for (let i = 0; i + 1 < len; i += 2) {
    const ch = data[off + i] | (data[off + i + 1] << 8);
    if (ch === 0) break;
    s += String.fromCharCode(ch);
  }
  return s;
}

/* ---------- NK record ---------- */

interface NkRecord {
  name: string;
  subkeyCount: number;
  subkeyListOff: number;
  valueCount: number;
  valueListOff: number;
  timestamp: string;
}

function parseNk(data: Uint8Array, absOff: number): NkRecord | null {
  if (absOff + 0x4c > data.length) return null;
  if (data[absOff] !== 0x6e || data[absOff + 1] !== 0x6b) return null; // 'nk'
  const flags = readU16LE(data, absOff + 2);
  const timestamp = filetimeToISO(readU64LE(data, absOff + 4));
  const subkeyCount = u32LE(data, absOff + 0x18);
  const subkeyListOff = u32LE(data, absOff + 0x20);
  const valueCount = u32LE(data, absOff + 0x28);
  const valueListOff = u32LE(data, absOff + 0x2c);
  const nameLen = readU16LE(data, absOff + 0x48);
  const ascii = (flags & 0x20) !== 0;
  const name = readName(data, absOff + 0x4c, nameLen, ascii);
  return { name, subkeyCount, subkeyListOff, valueCount, valueListOff, timestamp };
}

/* ---------- Subkey list ---------- */

function getSubkeyOffsets(data: Uint8Array, listOff: number): number[] {
  if (listOff === 0xffffffff || listOff === 0) return [];
  const abs = relToAbs(listOff);
  if (abs + 4 > data.length) return [];
  const sig = bytesToText(data.subarray(abs, abs + 2));
  const count = readU16LE(data, abs + 2);
  const offsets: number[] = [];
  const max = Math.min(count, MAX_SUBKEYS_PER_NODE);

  if (sig === 'lf' || sig === 'lh') {
    for (let i = 0; i < max; i++) {
      const off = abs + 4 + i * 8;
      if (off + 4 > data.length) break;
      const rel = u32LE(data, off);
      offsets.push(rel);
    }
  } else if (sig === 'li') {
    for (let i = 0; i < max; i++) {
      const off = abs + 4 + i * 4;
      if (off + 4 > data.length) break;
      const rel = u32LE(data, off);
      offsets.push(rel);
    }
  } else if (sig === 'ri') {
    for (let i = 0; i < max; i++) {
      const off = abs + 4 + i * 4;
      if (off + 4 > data.length) break;
      const rel = u32LE(data, off);
      const sub = getSubkeyOffsets(data, rel);
      for (const s of sub) offsets.push(s);
    }
  }
  return offsets;
}

/* ---------- VK record ---------- */

interface VkRecord {
  name: string;
  type: string;
  data: string;
}

function parseVk(data: Uint8Array, absOff: number): VkRecord | null {
  if (absOff + 0x14 > data.length) return null;
  if (data[absOff] !== 0x76 || data[absOff + 1] !== 0x6b) return null; // 'vk'
  const nameLen = readU16LE(data, absOff + 2);
  let dataSize = u32LE(data, absOff + 4);
  const dataOff = u32LE(data, absOff + 8);
  const dataType = u32LE(data, absOff + 0x0c);
  const flags = readU16LE(data, absOff + 0x10);
  const ascii = (flags & 0x01) !== 0;

  const name = nameLen === 0 ? '(默认)' : readName(data, absOff + 0x14, nameLen, ascii);
  const typeName = VALUE_TYPES[dataType] ?? `0x${dataType.toString(16)}`;

  /* Inline data (MSB of dataSize set) */
  if ((dataSize & 0x80000000) !== 0) {
    const inlineSize = dataSize & 0x7fffffff;
    const inlineData = data.subarray(absOff + 8, absOff + 8 + Math.min(inlineSize, 4));
    return { name, type: typeName, data: formatValue(dataType, inlineData) };
  }

  if (dataSize === 0 || dataOff === 0xffffffff) {
    return { name, type: typeName, data: '(空)' };
  }

  const dataAbs = relToAbs(dataOff);
  if (dataAbs + dataSize > data.length) dataSize = data.length - dataAbs;
  const valData = data.subarray(dataAbs, dataAbs + Math.min(dataSize, 4096));
  return { name, type: typeName, data: formatValue(dataType, valData) };
}

function formatValue(type: number, data: Uint8Array): string {
  if (data.length === 0) return '(空)';
  switch (type) {
    case 1: // REG_SZ
    case 2: { // REG_EXPAND_SZ
      let s = '';
      for (let i = 0; i + 1 < data.length; i += 2) {
        const ch = data[i] | (data[i + 1] << 8);
        if (ch === 0) break;
        s += String.fromCharCode(ch);
      }
      return s || '(空)';
    }
    case 4: // REG_DWORD
      if (data.length >= 4) return String(u32LE(data, 0));
      return '(数据不足)';
    case 7: { // REG_MULTI_SZ
      const strs: string[] = [];
      let s = '';
      for (let i = 0; i + 1 < data.length; i += 2) {
        const ch = data[i] | (data[i + 1] << 8);
        if (ch === 0) {
          if (s) strs.push(s);
          s = '';
        } else {
          s += String.fromCharCode(ch);
        }
      }
      return strs.join(' | ') || '(空)';
    }
    case 11: { // REG_QWORD
      if (data.length >= 8) return readU64LE(data, 0).toString();
      return '(数据不足)';
    }
    default: {
      const max = Math.min(data.length, 64);
      const parts: string[] = [];
      for (let i = 0; i < max; i++) parts.push(data[i].toString(16).padStart(2, '0').toUpperCase());
      let s = parts.join(' ');
      if (data.length > 64) s += `... (${data.length} 字节)`;
      return s;
    }
  }
}

/* ---------- Tree traversal ---------- */

function traverseKey(data: Uint8Array, relOff: number, depth: number, lines: string[]): void {
  if (depth > MAX_DEPTH) return;
  const abs = relToAbs(relOff);
  const nk = parseNk(data, abs);
  if (!nk) return;

  const indent = '  '.repeat(depth);
  const rootMark = depth === 0 ? ' [ROOT]' : '';
  lines.push(`${indent}📁 ${nk.name}${rootMark}`);
  if (depth === 0 || nk.timestamp !== '(无)') {
    lines.push(`${indent}   最后写入: ${nk.timestamp}`);
  }

  /* Values */
  if (nk.valueCount > 0 && nk.valueListOff !== 0xffffffff) {
    const vListAbs = relToAbs(nk.valueListOff);
    const maxVals = Math.min(nk.valueCount, MAX_VALUES_PER_NODE);
    for (let i = 0; i < maxVals; i++) {
      const off = vListAbs + i * 4;
      if (off + 4 > data.length) break;
      const vkRel = u32LE(data, off);
      const vk = parseVk(data, relToAbs(vkRel));
      if (vk) {
        const valStr = vk.data.length > 100 ? vk.data.substring(0, 100) + '...' : vk.data;
        lines.push(`${indent}   🔑 ${vk.name} = ${valStr}  (${vk.type})`);
      }
    }
    if (nk.valueCount > maxVals) {
      lines.push(`${indent}   ... 还有 ${nk.valueCount - maxVals} 个值未显示`);
    }
  }

  /* Subkeys */
  if (nk.subkeyCount > 0 && nk.subkeyListOff !== 0xffffffff) {
    const subkeyOffsets = getSubkeyOffsets(data, nk.subkeyListOff);
    const shown = Math.min(subkeyOffsets.length, MAX_SUBKEYS_PER_NODE);
    for (let i = 0; i < shown; i++) {
      traverseKey(data, subkeyOffsets[i], depth + 1, lines);
    }
    if (subkeyOffsets.length > shown) {
      lines.push(`${indent}  ... 还有 ${subkeyOffsets.length - shown} 个子键未显示`);
    }
  }
  if (depth < MAX_DEPTH) lines.push('');
}

/* ---------- Main parse ---------- */

const parse = (bytes: Uint8Array): string => {
  if (bytes.length < 0x1000) throw new Error('数据过短，至少需要 4096 字节 (1 个 base block)');
  const L: string[] = [];
  L.push('═══════════════════════════════════════════');
  L.push('  Windows 注册表解析报告');
  L.push('═══════════════════════════════════════════');
  L.push('');

  /* --- regf header --- */
  const sig = bytesToText(bytes.subarray(0, 4));
  if (sig !== 'regf') {
    const headHex = Array.from(bytes.slice(0, 4))
      .map((b: number) => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
    L.push(`⚠️ 警告: 未检测到 regf 魔数`);
    L.push(`  实际前 4 字节: ${headHex}`);
    L.push(`  期望: 72656766 (regf)`);
    return L.join('\n');
  }

  L.push('── regf 文件头 ──');
  L.push(`  魔数: regf ✓`);
  const primarySeq = u32LE(bytes, 4);
  const secondarySeq = u32LE(bytes, 8);
  const timestamp = filetimeToISO(readU64LE(bytes, 0x0c));
  const majorVer = u32LE(bytes, 0x14);
  const minorVer = u32LE(bytes, 0x18);
  const rootKeyOff = u32LE(bytes, 0x20);
  const hiveName = readName(bytes, 0x30, 64, false).replace(/\0/g, '');
  L.push(`  版本: ${majorVer}.${minorVer}`);
  L.push(`  主序列号: ${primarySeq}`);
  L.push(`  从序列号: ${secondarySeq}`);
  L.push(`  最后修改: ${timestamp}`);
  L.push(`  Hive 名称: ${hiveName || '(无)'}`);
  L.push(`  根键偏移: 0x${rootKeyOff.toString(16).toUpperCase()} (相对 0x1000)`);
  L.push('');

  /* --- Hive bins scan --- */
  let hbinCount = 0;
  let off = HBIN_START;
  while (off + 4 <= bytes.length) {
    const hbinSig = bytesToText(bytes.subarray(off, off + 4));
    if (hbinSig !== 'hbin') break;
    hbinCount++;
    const relNext = u32LE(bytes, off + 8);
    if (relNext === 0) break;
    off += relNext;
  }
  L.push(`── Hive Bin 统计 ──`);
  L.push(`  Hive Bin 数量: ${hbinCount}`);
  L.push('');

  /* --- Root key tree --- */
  L.push('── 注册表键值树 ──');
  L.push('');
  if (rootKeyOff !== 0xffffffff && rootKeyOff !== 0) {
    const treeLines: string[] = [];
    traverseKey(bytes, rootKeyOff, 0, treeLines);
    if (treeLines.length === 0) {
      L.push('  无法解析根键');
    } else {
      L.push(...treeLines);
    }
  } else {
    L.push('  无有效根键');
  }

  return L.join('\n');
};

const ToolComponent = (props: ToolProps) => (
  <AsyncTool {...props} toolName="Windows注册表解析"
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
