import AsyncTool from '../../_shared/AsyncTool';
import { readFileAsHex } from '../../_shared/inputUtils';
import { parseHex, readU32LE, readU16LE } from '../../_shared/hexUtils';
import type { ToolProps } from '../../types';

/* ---------- Constants ---------- */

const EPOCH_OFFSET = 116444736000000000n;

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

function readWString(bytes: Uint8Array, offset: number, maxChars: number): string {
  const chars: string[] = [];
  for (let i = 0; i < maxChars && offset + i * 2 + 1 < bytes.length; i++) {
    const lo = bytes[offset + i * 2];
    const hi = bytes[offset + i * 2 + 1];
    if (lo === 0 && hi === 0) break;
    chars.push(String.fromCharCode(lo | (hi << 8)));
  }
  return chars.join('');
}

function extractUTF16Strings(data: Uint8Array, start: number, end: number): string[] {
  const strings: string[] = [];
  let current = '';
  let offset = start;
  while (offset + 1 < end) {
    const lo = data[offset];
    const hi = data[offset + 1];
    if (lo === 0 && hi === 0) {
      if (current.length > 0) strings.push(current);
      current = '';
      offset += 2;
    } else if (hi === 0 && lo >= 0x20 && lo < 0x7f) {
      current += String.fromCharCode(lo);
      offset += 2;
    } else {
      if (current.length > 0) strings.push(current);
      current = '';
      offset += 1;
    }
  }
  if (current.length > 0) strings.push(current);
  return strings;
}

/* ---------- Main parse ---------- */

const parse = (bytes: Uint8Array): string => {
  if (bytes.length < 0x70) throw new Error('数据过短，无法解析 Prefetch 头');

  const L: string[] = [];
  L.push('═══════════════════════════════════════════');
  L.push('  Prefetch 文件解析报告');
  L.push('═══════════════════════════════════════════');
  L.push('');

  const sigMama = bytes[0] === 0x4D && bytes[1] === 0x41 && bytes[2] === 0x4D && bytes[3] === 0x41;
  const sigMaro = bytes[0] === 0x4D && bytes[1] === 0x41 && bytes[2] === 0x52 && bytes[3] === 0x4F;
  if (!sigMama && !sigMaro) {
    const sigHex = [bytes[0], bytes[1], bytes[2], bytes[3]]
      .map((b: number) => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
    throw new Error(`无效的 Prefetch 签名: ${sigHex} (期望 4D414D41 "MAMA" 或 4D41524F "MARO")`);
  }

  const sigStr = sigMama ? 'MAMA' : 'MARO';
  const fileSize = readU32LE(bytes, 0x08) >>> 0;
  const exeName = readWString(bytes, 0x0C, 30);
  const hash = readU32LE(bytes, 0x48) >>> 0;

  L.push('── 文件头 ──');
  L.push(`  签名: ${sigStr} ✓`);
  L.push(`  可执行文件: ${exeName || '(未知)'}`);
  L.push(`  文件大小: ${fileSize} 字节`);
  L.push(`  Hash: 0x${hash.toString(16).padStart(8, '0').toUpperCase()}`);
  L.push('');

  const metricsOffset = readU32LE(bytes, 0x50) >>> 0;
  const metricsCount = readU32LE(bytes, 0x54) >>> 0;
  const volumesOffset = readU32LE(bytes, 0x58) >>> 0;
  const volumesCount = readU32LE(bytes, 0x5C) >>> 0;
  const stringsOffset = readU32LE(bytes, 0x64) >>> 0;
  const stringsSize = readU32LE(bytes, 0x68) >>> 0;

  L.push('── 运行信息 ──');
  L.push(`  文件引用数: ${metricsCount}`);

  let runCount = 0;
  let lastRunTime = '(无)';
  if (metricsOffset > 0 && metricsOffset + 12 < bytes.length && metricsCount > 0) {
    const ft = readU64LE(bytes, metricsOffset);
    lastRunTime = filetimeToISO(ft);
    runCount = readU32LE(bytes, metricsOffset + 8) >>> 0;
  }
  L.push(`  运行次数: ${runCount}`);
  L.push(`  最后运行时间: ${lastRunTime}`);
  L.push('');

  L.push('── 卷信息 ──');
  L.push(`  卷数量: ${volumesCount}`);
  let volSerial = '(未知)';
  let devicePath = '(未知)';
  if (volumesOffset > 0 && volumesOffset + 0x14 < bytes.length && volumesCount > 0) {
    const serial = readU32LE(bytes, volumesOffset + 0x10) >>> 0;
    volSerial = `0x${serial.toString(16).padStart(8, '0').toUpperCase()}`;
    const deviceStrOffset = readU32LE(bytes, volumesOffset) >>> 0;
    if (deviceStrOffset > 0 && stringsOffset > 0) {
      const absOffset = stringsOffset + deviceStrOffset;
      if (absOffset < bytes.length) {
        devicePath = readWString(bytes, absOffset, 260);
      }
    }
  }
  L.push(`  卷序列号: ${volSerial}`);
  L.push(`  设备路径: ${devicePath}`);
  L.push('');

  L.push('── 加载的文件列表 (DLL) ──');
  if (stringsOffset > 0 && stringsSize > 0 && stringsOffset + stringsSize <= bytes.length) {
    const fileList = extractUTF16Strings(bytes, stringsOffset, stringsOffset + stringsSize);
    fileList.forEach((s: string, i: number) => {
      L.push(`  [${i + 1}] ${s}`);
    });
    L.push(`  (共 ${fileList.length} 个文件)`);
  } else {
    L.push('  (无文件字符串数据)');
  }

  return L.join('\n');
};

const ToolComponent = (props: ToolProps) => (
  <AsyncTool {...props} toolName="Prefetch文件解析"
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
