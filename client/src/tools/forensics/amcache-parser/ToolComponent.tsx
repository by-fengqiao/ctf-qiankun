import AsyncTool from '../../_shared/AsyncTool';
import { readFileAsHex } from '../../_shared/inputUtils';
import { parseHex, readU32LE, readU16LE } from '../../_shared/hexUtils';
import type { ToolProps } from '../../types';

/* ---------- regf (registry hive) helpers ---------- */

interface RegfHeader {
  signature: string;
  primarySequence: number;
  secondarySequence: number;
  lastWrite: bigint;
  majorVersion: number;
  minorVersion: number;
  rootCellOffset: number;
  hiveBinCount: number;
}

function readU64LE(bytes: Uint8Array, offset: number): bigint {
  let val = 0n;
  for (let i = 7; i >= 0; i--) {
    val = (val << 8n) | BigInt(bytes[offset + i]);
  }
  return val;
}

const EPOCH_OFFSET = 116444736000000000n;

function filetimeToISO(ft: bigint): string {
  if (ft === 0n) return '(无)';
  if (ft < EPOCH_OFFSET) return '(无效)';
  const unixMs = Number((ft - EPOCH_OFFSET) / 10000n);
  if (unixMs < 0 || unixMs > 20000000000000) return '(无效)';
  return new Date(unixMs).toISOString();
}

function parseRegfHeader(bytes: Uint8Array): RegfHeader {
  if (bytes.length < 0x200) throw new Error('数据过短，无法解析 regf 头部');
  const sig = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);
  if (sig !== 'regf') {
    throw new Error(`无效的 regf 签名: ${sig} (期望 "regf")`);
  }
  const primarySeq = readU32LE(bytes, 0x04) >>> 0;
  const secondarySeq = readU32LE(bytes, 0x08) >>> 0;
  const lastWrite = readU64LE(bytes, 0x0C);
  const major = readU16LE(bytes, 0x14);
  const minor = readU16LE(bytes, 0x16);
  const rootCell = readU32LE(bytes, 0x18) >>> 0;
  const hiveBinCount = readU32LE(bytes, 0x28) >>> 0;
  return {
    signature: sig,
    primarySequence: primarySeq,
    secondarySequence: secondarySeq,
    lastWrite,
    majorVersion: major,
    minorVersion: minor,
    rootCellOffset: rootCell,
    hiveBinCount,
  };
}

/* ---------- String extraction for ApplicationFile entries ---------- */

interface AppEntry {
  programName: string;
  companyName: string;
  fileVersion: string;
  size: string;
  sha1: string;
  productId: string;
  rawStrings: string[];
}

function extractUTF16Strings(data: Uint8Array, start: number, end: number, minLen: number): string[] {
  const strings: string[] = [];
  let current = '';
  let offset = start;
  while (offset + 1 < end) {
    const lo = data[offset];
    const hi = data[offset + 1];
    if (lo === 0 && hi === 0) {
      if (current.length >= minLen) strings.push(current);
      current = '';
      offset += 2;
    } else if (hi === 0 && lo >= 0x20 && lo < 0x7f) {
      current += String.fromCharCode(lo);
      offset += 2;
    } else if (hi !== 0 && lo !== 0) {
      // Non-ASCII UTF-16, try to decode
      current += String.fromCharCode(lo | (hi << 8));
      offset += 2;
    } else {
      if (current.length >= minLen) strings.push(current);
      current = '';
      offset += 1;
    }
  }
  if (current.length >= minLen) strings.push(current);
  return strings;
}

function extractASCIIStrings(data: Uint8Array, start: number, end: number, minLen: number): string[] {
  const strings: string[] = [];
  let current = '';
  for (let i = start; i < end; i++) {
    const b = data[i];
    if (b >= 0x20 && b < 0x7f) {
      current += String.fromCharCode(b);
    } else {
      if (current.length >= minLen) strings.push(current);
      current = '';
    }
  }
  if (current.length >= minLen) strings.push(current);
  return strings;
}

function isSha1Hex(s: string): boolean {
  return /^[0-9A-Fa-f]{40}$/.test(s);
}

function looksLikeProgram(s: string): boolean {
  return /\.(exe|dll|sys|msi|bat|cmd|ps1)$/i.test(s);
}

function parseApplicationFileEntries(bytes: Uint8Array): AppEntry[] {
  const entries: AppEntry[] = [];
  // Scan for SHA1 hashes (40 hex chars) which anchor ApplicationFile entries
  const asciiStrings = extractASCIIStrings(bytes, 0x200, bytes.length, 4);
  const utf16Strings = extractUTF16Strings(bytes, 0x200, bytes.length, 4);
  const allStrings = [...asciiStrings, ...utf16Strings];

  // Find SHA1 hashes and build entries around them
  const sha1Hashes = allStrings.filter(isSha1Hex);
  const programs = allStrings.filter(looksLikeProgram);
  const versions = allStrings.filter((s: string) => /^\d+\.\d+/.test(s) && s.length < 30);
  const companies = allStrings.filter((s: string) =>
    /(Corporation|Inc\.|Ltd\.|Company|Software|Technologies|Systems|Ltd|Co\.|GmbH|S\.A\.|LLC|Limited)/i.test(s) && s.length < 100,
  );

  // Build entries: each SHA1 is a potential ApplicationFile entry
  const usedSha1 = new Set<string>();
  sha1Hashes.forEach((sha1: string, idx: number) => {
    if (usedSha1.has(sha1)) return;
    usedSha1.add(sha1);
    const program = programs[idx] || programs[idx % programs.length] || '(未知)';
    const company = companies[idx] || companies[idx % (companies.length || 1)] || '(未知)';
    const version = versions[idx] || versions[idx % (versions.length || 1)] || '(未知)';
    entries.push({
      programName: program,
      companyName: company,
      fileVersion: version,
      size: '(需完整解析)',
      sha1: sha1.toUpperCase(),
      productId: '(未知)',
      rawStrings: [],
    });
  });

  // If no SHA1 found, fall back to program-based grouping
  if (entries.length === 0 && programs.length > 0) {
    const uniquePrograms = [...new Set(programs)];
    uniquePrograms.slice(0, 50).forEach((program: string) => {
      entries.push({
        programName: program,
        companyName: '(需完整解析)',
        fileVersion: '(需完整解析)',
        size: '(需完整解析)',
        sha1: '(需完整解析)',
        productId: '(未知)',
        rawStrings: [],
      });
    });
  }
  return entries;
}

/* ---------- Main parse ---------- */

const parse = (bytes: Uint8Array): string => {
  const header = parseRegfHeader(bytes);
  const L: string[] = [];
  L.push('═══════════════════════════════════════════');
  L.push('  Amcache.hve 解析报告');
  L.push('═══════════════════════════════════════════');
  L.push('');

  L.push('── 蜂巢头部 (regf header) ──');
  L.push(`  签名: ${header.signature} ✓`);
  L.push(`  主序列号: ${header.primarySequence}`);
  L.push(`  副序列号: ${header.secondarySequence}`);
  L.push(`  最后写入时间: ${filetimeToISO(header.lastWrite)}`);
  L.push(`  版本: ${header.majorVersion}.${header.minorVersion}`);
  L.push(`  根单元格偏移: 0x${header.rootCellOffset.toString(16).toUpperCase()}`);
  L.push(`  Hive Bin 数量: ${header.hiveBinCount}`);
  L.push(`  数据大小: ${bytes.length} 字节`);
  L.push('');

  L.push('── Hive Bins ──');
  // Walk hive bins (each starts with "hbin" signature)
  let binOffset = 0x1000;
  let binCount = 0;
  while (binOffset + 0x20 <= bytes.length) {
    const sig = String.fromCharCode(
      bytes[binOffset], bytes[binOffset + 1], bytes[binOffset + 2], bytes[binOffset + 3],
    );
    if (sig !== 'hbin') break;
    const binSize = readU32LE(bytes, binOffset + 8) >>> 0;
    binCount++;
    if (binSize === 0 || binOffset + binSize > bytes.length) break;
    binOffset += binSize;
  }
  L.push(`  找到 Hive Bin: ${binCount} 个`);
  L.push('');

  L.push('── ApplicationFile 条目 ──');
  const entries = parseApplicationFileEntries(bytes);
  if (entries.length === 0) {
    L.push('  (未找到应用程序条目)');
    L.push('  提示: Amcache.hve 中的 ApplicationFile 记录包含 SHA1 哈希');
    L.push('  本工具通过字符串扫描提取，完整解析需要 regf 单元遍历');
  } else {
    L.push(`  找到条目: ${entries.length} 个`);
    L.push('');
    entries.forEach((e: AppEntry, i: number) => {
      L.push(`[${i + 1}] ${e.programName}`);
      L.push(`  SHA1:   ${e.sha1}`);
      L.push(`  公司:   ${e.companyName}`);
      L.push(`  版本:   ${e.fileVersion}`);
      L.push(`  大小:   ${e.size}`);
      L.push('');
    });
  }

  L.push('── 备注 ──');
  L.push('  Amcache.hve 位于 C:\\Windows\\AppCompat\\Programs\\');
  L.push('  记录程序执行历史，含 SHA1 哈希用于完整性校验');
  L.push('  完整 regf 解析需遍历 NK/VK/LF/LH 等单元格类型');
  return L.join('\n');
};

const ToolComponent = (props: ToolProps) => (
  <AsyncTool {...props} toolName="Amcache.hve解析"
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
