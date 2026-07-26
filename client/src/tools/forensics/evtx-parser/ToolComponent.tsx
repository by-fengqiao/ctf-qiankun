import AsyncTool from '../../_shared/AsyncTool';
import { readFileAsHex } from '../../_shared/inputUtils';
import { parseHex } from '../../_shared/hexUtils';
import type { ToolProps } from '../../types';

/* ---------- Constants ---------- */

const EPOCH_OFFSET = 116444736000000000n;

const KNOWN_CHANNELS = [
  'Application', 'Security', 'System', 'Setup', 'ForwardedEvents',
];

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

function extractUTF16Strings(data: Uint8Array, start: number, end: number): string[] {
  const strings: string[] = [];
  let current = '';
  for (let i = start; i + 1 < end; i += 2) {
    const lo = data[i];
    const hi = data[i + 1];
    if (hi === 0 && lo >= 0x20 && lo < 0x7f) {
      current += String.fromCharCode(lo);
    } else {
      if (current.length >= 3) strings.push(current);
      current = '';
    }
  }
  if (current.length >= 3) strings.push(current);
  return strings;
}

interface EvtxEvent {
  recordId: bigint;
  timestamp: string;
  eventId: number;
  provider: string;
  channel: string;
  computer: string;
  strings: string[];
}

function parseRecord(data: Uint8Array, recordStart: number): EvtxEvent | null {
  if (data[recordStart] !== 0x2a || data[recordStart + 1] !== 0x2a) return null;
  const size = (
    data[recordStart + 4] |
    (data[recordStart + 5] << 8) |
    (data[recordStart + 6] << 16) |
    (data[recordStart + 7] << 24)
  ) >>> 0;
  if (size < 24 || recordStart + size > data.length) return null;

  const recordId = readU64LE(data, recordStart + 8);
  const filetime = readU64LE(data, recordStart + 16);
  const timestamp = filetimeToISO(filetime);

  const bodyStart = recordStart + 24;
  const bodyEnd = recordStart + size - 8;
  const strings = extractUTF16Strings(data, bodyStart, bodyEnd);

  let eventId = 0;
  for (let i = bodyStart; i < bodyEnd - 4; i++) {
    if (data[i] === 0x09 && data[i + 2] === 0x06) {
      const val = data[i + 3] | (data[i + 4] << 8);
      if (val > 0 && val < 65536) {
        eventId = val;
        break;
      }
    }
  }

  let provider = '';
  let channel = '';
  let computer = '';

  for (const s of strings) {
    if (!channel && (KNOWN_CHANNELS.includes(s) || s.startsWith('Microsoft-Windows-'))) {
      channel = s;
    } else if (!provider && s.includes('-') && s.length > 5) {
      provider = s;
    } else if (!computer && s.length >= 3 && s.length <= 20 &&
               s === s.toUpperCase() && /^[A-Z0-9_-]+$/.test(s)) {
      computer = s;
    }
  }

  return { recordId, timestamp, eventId, provider, channel, computer, strings };
}

/* ---------- Main parse ---------- */

const parse = (bytes: Uint8Array): string => {
  if (bytes.length < 8) throw new Error('数据过短，无法解析 EVTX 头');

  const L: string[] = [];
  L.push('═══════════════════════════════════════════');
  L.push('  EVTX 事件日志解析报告');
  L.push('═══════════════════════════════════════════');
  L.push('');

  const isElfFile = bytes[0] === 0x45 && bytes[1] === 0x6C && bytes[2] === 0x66 &&
                    bytes[3] === 0x46 && bytes[4] === 0x69 && bytes[5] === 0x6C &&
                    bytes[6] === 0x65;
  if (isElfFile) {
    L.push('── 文件头 ──');
    L.push('  魔数: ElfFile ✓');
    L.push(`  格式版本: ${bytes[8]}.${bytes[9]}`);
  } else {
    L.push('⚠️ 警告: 未检测到 ElfFile 魔数，可能不是有效的 EVTX 文件');
    const headHex = Array.from(bytes.slice(0, 8))
      .map((b: number) => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
    L.push(`  实际前 8 字节: ${headHex}`);
  }
  L.push('');

  let chunkCount = 0;
  const chunkSize = 65536;
  const fileHeaderSize = 4096;
  for (let off = fileHeaderSize; off + 8 <= bytes.length; off += chunkSize) {
    if (bytes[off] === 0x45 && bytes[off + 1] === 0x6C && bytes[off + 2] === 0x66 &&
        bytes[off + 3] === 0x43 && bytes[off + 4] === 0x68 && bytes[off + 5] === 0x6E &&
        bytes[off + 6] === 0x6B) {
      chunkCount++;
    }
  }
  L.push(`  Chunk 数量: ${chunkCount}`);
  L.push('');

  const events: EvtxEvent[] = [];
  const MAX_RECORDS = 200;
  for (let i = 0; i < bytes.length - 4 && events.length < MAX_RECORDS; i++) {
    if (bytes[i] === 0x2a && bytes[i + 1] === 0x2a && bytes[i + 2] === 0x00 && bytes[i + 3] === 0x00) {
      const evt = parseRecord(bytes, i);
      if (evt) {
        events.push(evt);
        const size = (bytes[i + 4] | (bytes[i + 5] << 8) | (bytes[i + 6] << 16) | (bytes[i + 7] << 24)) >>> 0;
        if (size > 4) i += size - 1;
      }
    }
  }

  L.push(`  记录数量: ${events.length}` + (events.length >= MAX_RECORDS ? ' (已截断，最多显示 200 条)' : ''));
  L.push('');

  if (events.length === 0) {
    L.push('未找到事件记录。');
    return L.join('\n');
  }

  L.push('═══════════════════════════════════════════');
  L.push('  事件列表');
  L.push('═══════════════════════════════════════════');
  L.push('');
  L.push('时间 | EventID | 来源 | 通道 | 计算机');
  L.push('─'.repeat(80));

  events.forEach((evt: EvtxEvent) => {
    const idStr = evt.eventId > 0 ? String(evt.eventId) : '?';
    L.push(`${evt.timestamp} | ${idStr} | ${evt.provider || '?'} | ${evt.channel || '?'} | ${evt.computer || '?'}`);
  });

  L.push('');
  L.push('── 详细信息 (前 5 条) ──');
  L.push('');

  const detailCount = Math.min(5, events.length);
  for (let i = 0; i < detailCount; i++) {
    const evt = events[i];
    L.push(`[Record #${evt.recordId}] ${evt.timestamp}`);
    if (evt.eventId > 0) L.push(`  EventID: ${evt.eventId}`);
    if (evt.provider) L.push(`  Provider: ${evt.provider}`);
    if (evt.channel) L.push(`  Channel: ${evt.channel}`);
    if (evt.computer) L.push(`  Computer: ${evt.computer}`);
    if (evt.strings.length > 0) {
      L.push(`  EventData (提取字符串 ${evt.strings.length} 条):`);
      evt.strings.forEach((s: string, j: number) => {
        L.push(`    [${j}] ${s}`);
      });
    }
    L.push('');
  }

  return L.join('\n');
};

const ToolComponent = (props: ToolProps) => (
  <AsyncTool {...props} toolName="Windows事件日志解析"
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
