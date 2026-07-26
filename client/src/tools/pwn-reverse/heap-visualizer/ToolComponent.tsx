import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

/* ---------- glibc heap simulator ---------- */

interface Chunk {
  id: number;
  addr: number;
  size: number; // chunk size incl header
  reqSize: number;
  inUse: boolean;
  data: string;
  dataLen: number;
  fd: number; // chunk id or -1
  bk: number;
  bin: 'tcache' | 'fastbin' | 'unsorted' | 'none';
}

const HEADER_64 = 0x10;
const HEADER_32 = 0x08;
const MINSIZE_64 = 0x20;
const MINSIZE_32 = 0x10;
const ALIGN_64 = 0x10;
const ALIGN_32 = 0x08;
const TCACHE_MAX_SIZE_64 = 0x410;
const TCACHE_MAX_SIZE_32 = 0x208;
const TCACHE_COUNT = 7;
const FASTBIN_MAX_64 = 0x80;
const FASTBIN_MAX_32 = 0x40;

const alignUp = (n: number, a: number): number => Math.ceil(n / a) * a;

const computeChunkSize = (reqSize: number, is64: boolean): number => {
  const header = is64 ? HEADER_64 : HEADER_32;
  const minsize = is64 ? MINSIZE_64 : MINSIZE_32;
  const align = is64 ? ALIGN_64 : ALIGN_32;
  const dataNeeded = Math.max(reqSize, is64 ? 0x18 : 0x0c);
  const sz = alignUp(dataNeeded + header, align);
  return Math.max(sz, minsize);
};

const hex = (n: number): string => '0x' + n.toString(16);

const parseOp = (line: string): { op: string; args: string[] } | null => {
  const m = line.match(/^\s*(malloc|free|edit|show)\s*\((.*)\)\s*$/i);
  if (!m) return null;
  return { op: m[1].toLowerCase(), args: splitArgs(m[2]) };
};

const splitArgs = (s: string): string[] => {
  const out: string[] = [];
  let cur = '';
  let depth = 0;
  for (const ch of s) {
    if (ch === '(') { depth++; cur += ch; }
    else if (ch === ')') { depth--; cur += ch; }
    else if (ch === ',' && depth === 0) { out.push(cur.trim()); cur = ''; }
    else cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
};

const dataLenOf = (data: string): number => {
  const trimmed = data.replace(/^["']|["']$/g, '');
  if (/^0x[0-9a-fA-F]+$/.test(trimmed)) return Math.floor((trimmed.length - 2) / 2);
  return trimmed.length;
};

interface SimState {
  is64: boolean;
  base: number;
  top: number;
  chunks: Chunk[];
  ptrs: (number | null)[]; // user idx -> chunk id or null
  tcache: Map<number, number[]>; // size -> [chunkId] LIFO
  fastbins: Map<number, number[]>; // size -> [chunkId]
  unsorted: number[]; // chunkIds
  warnings: string[];
  step: number;
}

const newSim = (is64: boolean): SimState => ({
  is64,
  base: is64 ? 0x555555559000 : 0x0804a000,
  top: is64 ? 0x555555559000 : 0x0804a000,
  chunks: [],
  ptrs: [],
  tcache: new Map(),
  fastbins: new Map(),
  unsorted: [],
  warnings: [],
  step: 0,
});

const allocChunk = (st: SimState, reqSize: number): Chunk => {
  const size = computeChunkSize(reqSize, st.is64);
  const addr = st.top;
  st.top += size;
  const chunk: Chunk = {
    id: st.chunks.length,
    addr,
    size,
    reqSize,
    inUse: true,
    data: '',
    dataLen: 0,
    fd: -1,
    bk: -1,
    bin: 'none',
  };
  st.chunks.push(chunk);
  return chunk;
};

const malloc = (st: SimState, reqSize: number): number => {
  const size = computeChunkSize(reqSize, st.is64);
  const tcacheMax = st.is64 ? TCACHE_MAX_SIZE_64 : TCACHE_MAX_SIZE_32;
  // 1. tcache
  if (size <= tcacheMax) {
    const list = st.tcache.get(size);
    if (list && list.length > 0) {
      const cid = list.pop()!;
      const c = st.chunks[cid];
      c.inUse = true;
      c.bin = 'none';
      c.data = '';
      c.dataLen = 0;
      c.fd = -1;
      c.bk = -1;
      const idx = st.ptrs.length;
      st.ptrs.push(cid);
      return idx;
    }
  }
  // 2. fastbin
  const fastMax = st.is64 ? FASTBIN_MAX_64 : FASTBIN_MAX_32;
  if (size <= fastMax) {
    const list = st.fastbins.get(size);
    if (list && list.length > 0) {
      const cid = list.pop()!;
      const c = st.chunks[cid];
      c.inUse = true;
      c.bin = 'none';
      c.data = '';
      c.dataLen = 0;
      c.fd = -1;
      const idx = st.ptrs.length;
      st.ptrs.push(cid);
      return idx;
    }
  }
  // 3. unsorted exact
  for (let i = 0; i < st.unsorted.length; i++) {
    const c = st.chunks[st.unsorted[i]];
    if (c.size === size) {
      st.unsorted.splice(i, 1);
      c.inUse = true;
      c.bin = 'none';
      c.fd = -1;
      c.bk = -1;
      const idx = st.ptrs.length;
      st.ptrs.push(c.id);
      return idx;
    }
  }
  // 4. unsorted split (first fit >= size+minsize)
  const minsize = st.is64 ? MINSIZE_64 : MINSIZE_32;
  for (let i = 0; i < st.unsorted.length; i++) {
    const c = st.chunks[st.unsorted[i]];
    if (c.size >= size + minsize) {
      st.unsorted.splice(i, 1);
      c.inUse = true;
      c.bin = 'none';
      c.fd = -1;
      c.bk = -1;
      const idx = st.ptrs.length;
      st.ptrs.push(c.id);
      return idx;
    }
  }
  // 5. carve from top
  const chunk = allocChunk(st, reqSize);
  const idx = st.ptrs.length;
  st.ptrs.push(chunk.id);
  return idx;
};

const freeChunk = (st: SimState, idx: number): void => {
  if (idx < 0 || idx >= st.ptrs.length) {
    st.warnings.push(`free: 索引 ${idx} 不存在`);
    return;
  }
  const cid = st.ptrs[idx];
  if (cid === null) {
    st.warnings.push(`⚠ DOUBLE FREE: 索引 ${idx} 已被释放，再次释放将触发 double free!`);
    return;
  }
  const c = st.chunks[cid];
  if (!c.inUse) {
    st.warnings.push(`⚠ DOUBLE FREE: 索引 ${idx} 指向的 chunk #${cid} 已释放`);
    return;
  }
  c.inUse = false;
  const size = c.size;
  const tcacheMax = st.is64 ? TCACHE_MAX_SIZE_64 : TCACHE_MAX_SIZE_32;
  const fastMax = st.is64 ? FASTBIN_MAX_64 : FASTBIN_MAX_32;
  if (size <= tcacheMax) {
    let list = st.tcache.get(size);
    if (!list) { list = []; st.tcache.set(size, list); }
    if (list.length >= TCACHE_COUNT) {
      // tcache full, go to fastbin/unsorted
      if (size <= fastMax) {
        let fb = st.fastbins.get(size);
        if (!fb) { fb = []; st.fastbins.set(size, fb); }
        if (fb.length > 0) c.fd = fb[fb.length - 1]; else c.fd = -1;
        fb.push(c.id);
        c.bin = 'fastbin';
      } else {
        st.unsorted.push(c.id);
        c.bin = 'unsorted';
        c.fd = -1;
        c.bk = -1;
      }
    } else {
      if (list.length > 0) c.fd = list[list.length - 1]; else c.fd = -1;
      list.push(c.id);
      c.bin = 'tcache';
    }
  } else if (size <= fastMax) {
    let fb = st.fastbins.get(size);
    if (!fb) { fb = []; st.fastbins.set(size, fb); }
    if (fb.length > 0) c.fd = fb[fb.length - 1]; else c.fd = -1;
    fb.push(c.id);
    c.bin = 'fastbin';
  } else {
    st.unsorted.push(c.id);
    c.bin = 'unsorted';
    c.fd = -1;
    c.bk = -1;
  }
  // keep ptr dangling for UAF detection
};

const editChunk = (st: SimState, idx: number, data: string): void => {
  if (idx < 0 || idx >= st.ptrs.length) {
    st.warnings.push(`edit: 索引 ${idx} 不存在`);
    return;
  }
  const cid = st.ptrs[idx];
  if (cid === null) {
    st.warnings.push(`⚠ INVALID FREE: 索引 ${idx} 已释放，编辑无效`);
    return;
  }
  const c = st.chunks[cid];
  const header = st.is64 ? HEADER_64 : HEADER_32;
  const capacity = c.size - header;
  if (!c.inUse) {
    st.warnings.push(`⚠ UAF: 索引 ${idx} 指向已释放的 chunk #${cid}，存在 Use-After-Free!`);
  }
  const len = dataLenOf(data);
  if (len > capacity) {
    st.warnings.push(`⚠ HEAP OVERFLOW: 索引 ${idx} 写入 ${len} 字节超过 chunk 容量 ${capacity} 字节，溢出 ${len - capacity} 字节!`);
  }
  c.data = data.replace(/^["']|["']$/g, '');
  c.dataLen = len;
  // tcache poisoning detection: if freed and in tcache, fd may be overwritten
  if (!c.inUse && c.bin === 'tcache') {
    const fdVal = c.data;
    if (/^0x[0-9a-fA-F]+$/.test(fdVal)) {
      const target = parseInt(fdVal, 16);
      const isHeapAddr = target >= st.base && target < st.top;
      if (!isHeapAddr) {
        st.warnings.push(`⚠ TCACHE POISONING: 索引 ${idx} 的 fd 被篡改为 ${hex(target)} (非堆地址)，可实现 tcache poisoning 任意地址分配!`);
      }
    }
  }
};

const showChunk = (st: SimState, idx: number): string => {
  if (idx < 0 || idx >= st.ptrs.length) {
    st.warnings.push(`show: 索引 ${idx} 不存在`);
    return '';
  }
  const cid = st.ptrs[idx];
  if (cid === null) {
    st.warnings.push(`⚠ UAF (show): 索引 ${idx} 已释放，读取将获得 fd/bk 而非数据`);
    return '';
  }
  const c = st.chunks[cid];
  if (!c.inUse) {
    st.warnings.push(`⚠ UAF (show): 索引 ${idx} 指向已释放 chunk #${cid}，泄露 fd=${c.fd >= 0 ? hex(st.chunks[c.fd].addr) : 'NULL'}`);
  }
  return c.data || '(空)';
};

const renderChunk = (st: SimState, c: Chunk): string[] => {
  const L: string[] = [];
  const header = st.is64 ? HEADER_64 : HEADER_32;
  const flags = `P=${c.id === 0 ? 0 : 1} M=0 A=0`;
  L.push(`┌── Chunk #${c.id} @ ${hex(c.addr)} ──────────────────────`);
  L.push(`│ prev_size: ${hex(0)}  size: ${hex(c.size)}  [${flags}]`);
  L.push(`│ req_size: ${c.reqSize}  data_cap: ${c.size - header}`);
  if (c.inUse) {
    L.push(`│ data: "${c.data}" (${c.dataLen} bytes)`);
    L.push(`│ status: ✅ ALLOCATED`);
  } else {
    const fdStr = c.fd >= 0 ? hex(st.chunks[c.fd].addr) : 'NULL';
    const bkStr = c.bk >= 0 ? hex(st.chunks[c.bk].addr) : 'NULL';
    L.push(`│ fd: ${fdStr}  bk: ${bkStr}`);
    L.push(`│ data(freed): "${c.data}"`);
    L.push(`│ status: 🔴 FREED [bin: ${c.bin}]`);
  }
  L.push(`└──────────────────────────────────────────`);
  return L;
};

const renderBins = (st: SimState): string[] => {
  const L: string[] = [];
  L.push('── Tcache Bins ──');
  let any = false;
  for (const [size, list] of st.tcache) {
    if (list.length === 0) continue;
    any = true;
    const chain = list.slice().reverse().map((cid) => hex(st.chunks[cid].addr)).join(' -> ');
    L.push(`  [${hex(size)}] (${list.length}/${TCACHE_COUNT}): ${chain}`);
  }
  if (!any) L.push('  (空)');
  L.push('');
  L.push('── Fastbins ──');
  any = false;
  for (const [size, list] of st.fastbins) {
    if (list.length === 0) continue;
    any = true;
    const chain = list.slice().reverse().map((cid) => hex(st.chunks[cid].addr)).join(' -> ');
    L.push(`  [${hex(size)}]: ${chain}`);
  }
  if (!any) L.push('  (空)');
  L.push('');
  L.push('── Unsorted Bin ──');
  if (st.unsorted.length === 0) {
    L.push('  (空)');
  } else {
    const chain = st.unsorted.map((cid) => hex(st.chunks[cid].addr)).join(' -> ');
    L.push(`  ${chain}`);
  }
  return L;
};

const simulate = (input: string, is64: boolean): string => {
  const st = newSim(is64);
  const lines = input.split('\n').map((l) => l.trim()).filter(Boolean);
  const out: string[] = [];
  out.push('═══════════════════════════════════════════');
  out.push('  Glibc 堆布局模拟器 (glibc 2.31 风格)');
  out.push(`  架构: ${is64 ? '64-bit' : '32-bit'}  堆基址: ${hex(st.base)}`);
  out.push('═══════════════════════════════════════════');
  out.push('');

  for (const line of lines) {
    if (line.startsWith('#') || line.startsWith('//')) continue;
    const op = parseOp(line);
    if (!op) {
      st.warnings.push(`无法解析: "${line}"`);
      continue;
    }
    st.step++;
    out.push(`━━ 步骤 ${st.step}: ${line} ━━━━━━━━━━━━━━━━━━━━`);
    let result = '';
    if (op.op === 'malloc') {
      const sz = parseInt(op.args[0], 10);
      if (isNaN(sz)) { st.warnings.push(`malloc: 无效大小 "${op.args[0]}"`); }
      else {
        const idx = malloc(st, sz);
        result = `→ 分配 chunk #${st.ptrs[idx]}, 用户索引 = ${idx}`;
      }
    } else if (op.op === 'free') {
      const idx = parseInt(op.args[0], 10);
      freeChunk(st, idx);
      result = `→ 释放索引 ${idx}`;
    } else if (op.op === 'edit') {
      const idx = parseInt(op.args[0], 10);
      const data = op.args.slice(1).join(',');
      editChunk(st, idx, data);
      result = `→ 编辑索引 ${idx}`;
    } else if (op.op === 'show') {
      const idx = parseInt(op.args[0], 10);
      const data = showChunk(st, idx);
      result = `→ 显示索引 ${idx}: "${data}"`;
    }
    out.push(result);
    if (st.warnings.length > 0) {
      for (const w of st.warnings.splice(0)) out.push(`  ${w}`);
    }
    out.push('');
    out.push('── 堆布局快照 ──');
    const live = st.chunks.filter((c) => true).sort((a, b) => a.addr - b.addr);
    for (const c of live) out.push(...renderChunk(st, c));
    out.push('');
    out.push(...renderBins(st));
    out.push('');
    out.push(`top chunk: ${hex(st.top)} (剩余 ${hex(st.top - st.base)})`);
    out.push('');
  }

  // final security summary
  out.push('═══════════════════════════════════════════');
  out.push('  安全分析总结');
  out.push('═══════════════════════════════════════════');
  const allWarns: string[] = [];
  // re-scan for patterns
  const freedChunks = st.chunks.filter((c) => !c.inUse);
  if (freedChunks.length > 0) {
    allWarns.push(`• ${freedChunks.length} 个已释放 chunk 仍在堆中 (dangling pointers 可触发 UAF)`);
  }
  for (const [size, list] of st.tcache) {
    if (list.length >= 2) {
      const addrs = list.map((cid) => st.chunks[cid].addr);
      const dup = addrs.length !== new Set(addrs).size;
      if (dup) allWarns.push(`• tcache[${hex(size)}] 检测到重复 chunk，疑似 double free 链!`);
    }
  }
  if (allWarns.length === 0) out.push('  未检测到明显漏洞模式。');
  else for (const w of allWarns) out.push(`  ${w}`);
  out.push('');
  out.push('提示: edit 已释放索引可触发 UAF；篡改 tcache fd 可实现 poisoning；');
  out.push('      写入超长数据可触发 heap overflow。');
  return out.join('\n');
};

/* ---------- Component ---------- */

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    toolName="堆利用布局器"
    paramsConfig={[
      {
        name: 'arch',
        label: '架构',
        type: 'select',
        options: [
          { value: '64', label: '64位' },
          { value: '32', label: '32位' },
        ],
        default: '64',
      },
    ]}
    execute={(input: string, _mode: string, params: Record<string, unknown>): string => {
      const is64 = (params.arch as string) !== '32';
      return simulate(input, is64);
    }}
  />
);
export default ToolComponent;
