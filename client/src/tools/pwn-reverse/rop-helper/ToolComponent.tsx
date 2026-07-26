import SimpleTool from '../../_shared/SimpleTool';
import { parseHex } from '../../_shared/hexUtils';
import type { ToolProps } from '../../types';

/* ============================================================
 * ROP chain helper
 * Generates stack layout table + hex for:
 *   - execve("/bin/sh", 0, 0)     [syscall]
 *   - ret2libc (puts leak -> system + /bin/sh)
 *   - custom (passthrough gadget list)
 * ========================================================== */

interface Gadget {
  addr: number;
  desc: string;
}

const parseAddr = (tok: string): number => {
  const t = tok.trim().replace(/^0x/i, '');
  const v = parseInt(t, 16);
  if (Number.isNaN(v)) throw new Error(`无效的地址: ${tok}`);
  return v >>> 0;
};

const parseGadgets = (input: string): Gadget[] => {
  const gadgets: Gadget[] = [];
  const lines = input.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === '' || trimmed.startsWith('#') || trimmed.startsWith(';')) continue;
    // Support "addr | desc" or "addr desc" (addr first token, rest is description)
    const pipeIdx = trimmed.indexOf('|');
    let addrStr: string;
    let descStr: string;
    if (pipeIdx >= 0) {
      addrStr = trimmed.substring(0, pipeIdx).trim();
      descStr = trimmed.substring(pipeIdx + 1).trim();
    } else {
      const sp = /\s/.exec(trimmed);
      if (sp) {
        addrStr = trimmed.substring(0, sp.index).trim();
        descStr = trimmed.substring(sp.index + 1).trim();
      } else {
        addrStr = trimmed;
        descStr = '';
      }
    }
    const addr = parseAddr(addrStr);
    gadgets.push({ addr, desc: descStr });
  }
  return gadgets;
};

const findGadget = (gadgets: Gadget[], pattern: string): Gadget | null => {
  const re = new RegExp(pattern, 'i');
  for (const g of gadgets) {
    if (re.test(g.desc)) return g;
  }
  return null;
};

const toHexAddr = (addr: number, bits: 32 | 64): string => {
  const hex = addr.toString(16);
  const padded = hex.padStart(bits === 64 ? 16 : 8, '0');
  return padded;
};

const toBytesLE = (addr: number, bits: 32 | 64): number[] => {
  const nbytes = bits / 8;
  const out: number[] = [];
  // 64-bit addresses need BigInt
  const u = BigInt(addr);
  for (let i = 0; i < nbytes; i++) {
    out.push(Number((u >> BigInt(i * 8)) & 0xffn));
  }
  return out;
};

const padStr = (s: string, width: number): string => {
  return s.length >= width ? s : s + ' '.repeat(width - s.length);
};

/* ---------- execve chain ---------- */

const genExecve = (gadgets: Gadget[], bits: 32 | 64): string => {
  const missing: string[] = [];
  const popRdi = findGadget(gadgets, 'pop rdi');
  const popRsi = findGadget(gadgets, 'pop rsi');
  const popRdx = findGadget(gadgets, 'pop rdx');
  const syscall = findGadget(gadgets, 'syscall');
  const binShAddr = 0x404040; // placeholder address for "/bin/sh"
  // For 32-bit, would be int 0x80 instead
  const int80 = findGadget(gadgets, 'int\\s+0x80');
  if (!popRdi) missing.push('pop rdi; ret');
  if (!popRsi) missing.push('pop rsi; ret (或 pop rsi; pop r15; ret)');
  if (!popRdx) missing.push('pop rdx; ret');
  if (bits === 64 && !syscall) missing.push('syscall; ret (或 syscall)');
  if (bits === 32 && !int80) missing.push('int 0x80');

  const retGadget = findGadget(gadgets, '^ret$') ?? gadgets[0];

  const rows: { off: number; addr: number | null; meaning: string }[] = [];
  let offset = 0;

  // align ret (optional)
  if (retGadget) {
    rows.push({ off: offset, addr: retGadget.addr, meaning: 'ret (栈对齐)' });
    offset += bits / 8;
  }

  // rax = 59 (execve syscall number on x86_64)
  rows.push({ off: offset, addr: 0, meaning: 'pop rax; ret  (设置 rax=59, execve)' });
  offset += bits / 8;
  rows.push({ off: offset, addr: bits === 64 ? 59 : 11, meaning: bits === 64 ? 'rax = 59 (execve)' : 'eax = 11 (execve, int 0x80)' });
  offset += bits / 8;

  // rdi = "/bin/sh" address
  if (popRdi) {
    rows.push({ off: offset, addr: popRdi.addr, meaning: `pop rdi; ret  (${popRdi.desc})` });
    offset += bits / 8;
  }
  rows.push({ off: offset, addr: binShAddr, meaning: 'rdi = "/bin/sh" 字符串地址' });
  offset += bits / 8;

  // rsi = 0
  if (popRsi) {
    rows.push({ off: offset, addr: popRsi.addr, meaning: `pop rsi; ret  (${popRsi.desc})` });
    offset += bits / 8;
  }
  rows.push({ off: offset, addr: 0, meaning: 'rsi = 0 (argv=NULL)' });
  offset += bits / 8;
  // pop r15 if present (pop rsi; pop r15; ret pattern)
  if (popRsi && /pop r15/i.test(popRsi.desc)) {
    rows.push({ off: offset, addr: 0, meaning: 'r15 = 0 (pop rsi; pop r15; ret 的填充)' });
    offset += bits / 8;
  }

  // rdx = 0
  if (popRdx) {
    rows.push({ off: offset, addr: popRdx.addr, meaning: `pop rdx; ret  (${popRdx.desc})` });
    offset += bits / 8;
  }
  rows.push({ off: offset, addr: 0, meaning: 'rdx = 0 (envp=NULL)' });
  offset += bits / 8;

  // syscall
  if (bits === 64 && syscall) {
    rows.push({ off: offset, addr: syscall.addr, meaning: `syscall  (${syscall.desc})` });
    offset += bits / 8;
  } else if (bits === 32 && int80) {
    rows.push({ off: offset, addr: int80.addr, meaning: `int 0x80  (${int80.desc})` });
    offset += bits / 8;
  }

  // Build hex output (rows with addr != null and addr != 0 placeholder where gadget missing)
  const hexBytes: number[] = [];
  for (const r of rows) {
    if (r.addr !== null && r.addr !== 0) {
      hexBytes.push(...toBytesLE(r.addr, bits));
    } else {
      // placeholder zeros for values
      hexBytes.push(...new Array(bits / 8).fill(0));
    }
  }

  // Build table
  const offWidth = 6;
  const addrWidth = bits === 64 ? 18 : 10;
  const lines: string[] = [];
  lines.push(`── execve("/bin/sh", 0, 0) ROP 链 (${bits}位) ──`);
  lines.push('');
  lines.push(' Gadget 列表解析:');
  gadgets.forEach((g, i) => {
    lines.push(`  [${i}] 0x${toHexAddr(g.addr, bits)}  ${g.desc}`);
  });
  lines.push('');
  if (missing.length > 0) {
    lines.push(' ⚠ 缺少以下 gadget:');
    missing.forEach((m) => lines.push(`   - ${m}`));
    lines.push('');
  }
  lines.push(' 栈布局:');
  lines.push(`  ${padStr('偏移', offWidth)}  ${padStr('地址', addrWidth)}  含义`);
  lines.push(`  ${'-'.repeat(offWidth)}  ${'-'.repeat(addrWidth)}  ${'-'.repeat(40)}`);
  rows.forEach((r) => {
    const addrStr = r.addr !== null && r.addr !== 0 ? '0x' + toHexAddr(r.addr, bits) : '(待填)';
    lines.push(`  ${padStr('0x' + r.off.toString(16), offWidth)}  ${padStr(addrStr, addrWidth)}  ${r.meaning}`);
  });
  lines.push('');
  lines.push(' ROP chain hex (小端序):');
  const hexStr = hexBytes.map((b) => b.toString(16).padStart(2, '0')).join('');
  // format in groups of 8 bytes (16 hex chars)
  const groups: string[] = [];
  for (let i = 0; i < hexStr.length; i += (bits / 8) * 2) {
    groups.push(hexStr.substring(i, i + (bits / 8) * 2));
  }
  lines.push('  ' + groups.join('\n  '));
  lines.push('');
  lines.push(' 说明:');
  lines.push('  - execve 系统调用号: ' + (bits === 64 ? 'rax=59' : 'eax=11 (int 0x80)'));
  lines.push('  - 参数1 (rdi): "/bin/sh" 字符串地址');
  lines.push('  - 参数2 (rsi): 0 (argv=NULL)');
  lines.push('  - 参数3 (rdx): 0 (envp=NULL)');
  if (bits === 64) {
    lines.push('  - /bin/sh 字符串需预先在内存中布置, 地址需根据实际偏移调整');
  }

  return lines.join('\n');
};

/* ---------- ret2libc chain ---------- */

const genRet2libc = (gadgets: Gadget[], bits: 32 | 64): string => {
  const missing: string[] = [];
  const popRdi = findGadget(gadgets, 'pop rdi');
  const retGadget = findGadget(gadgets, '^ret$') ?? gadgets[0];
  // These addresses would come from libc leak; use placeholders
  const putsPlt = 0xdeadb000;
  const putsGot = 0xdeadb008;
  const mainAddr = 0xdeadb010;
  const systemAddr = 0xdeadb020;
  const binShAddr = 0xdeadb030;

  if (!popRdi) missing.push('pop rdi; ret');
  if (!retGadget) missing.push('ret (对齐)');

  const rows: { off: number; addr: number | null; meaning: string }[] = [];
  let offset = 0;

  // Stage 1: leak puts@GOT via puts@PLT
  if (bits === 64 && retGadget) {
    rows.push({ off: offset, addr: retGadget.addr, meaning: 'ret (栈对齐)' });
    offset += bits / 8;
  }
  if (popRdi) {
    rows.push({ off: offset, addr: popRdi.addr, meaning: `pop rdi; ret  (${popRdi.desc})` });
    offset += bits / 8;
  }
  rows.push({ off: offset, addr: putsGot, meaning: 'rdi = puts@GOT 地址' });
  offset += bits / 8;
  rows.push({ off: offset, addr: putsPlt, meaning: 'puts@PLT  (打印 puts 实际地址, 泄露 libc)' });
  offset += bits / 8;
  rows.push({ off: offset, addr: mainAddr, meaning: 'main 地址  (泄露后返回 main 进行二次攻击)' });
  offset += bits / 8;

  // Stage 2 (after libc leak, re-enter): system("/bin/sh")
  rows.push({ off: offset, addr: null, meaning: '─── 二次返回后 (libc 基址已知) ───' });
  offset += 0;
  if (bits === 64 && retGadget) {
    rows.push({ off: offset, addr: retGadget.addr, meaning: 'ret (栈对齐)' });
    offset += bits / 8;
  }
  if (popRdi) {
    rows.push({ off: offset, addr: popRdi.addr, meaning: `pop rdi; ret  (${popRdi.desc})` });
    offset += bits / 8;
  }
  rows.push({ off: offset, addr: binShAddr, meaning: 'rdi = "/bin/sh" 地址 (libc 内)' });
  offset += bits / 8;
  rows.push({ off: offset, addr: systemAddr, meaning: 'system() 地址 (libc 基址 + 偏移)' });
  offset += bits / 8;
  rows.push({ off: offset, addr: 0, meaning: 'fake return (system 退出后, 可填 exit)' });
  offset += bits / 8;

  const hexBytes: number[] = [];
  for (const r of rows) {
    if (r.addr !== null && r.addr !== 0) {
      hexBytes.push(...toBytesLE(r.addr, bits));
    } else {
      hexBytes.push(...new Array(bits / 8).fill(0));
    }
  }

  const offWidth = 6;
  const addrWidth = bits === 64 ? 18 : 10;
  const lines: string[] = [];
  lines.push(`── ret2libc ROP 链 (${bits}位) ──`);
  lines.push('');
  lines.push(' Gadget 列表解析:');
  gadgets.forEach((g, i) => {
    lines.push(`  [${i}] 0x${toHexAddr(g.addr, bits)}  ${g.desc}`);
  });
  lines.push('');
  if (missing.length > 0) {
    lines.push(' ⚠ 缺少以下 gadget:');
    missing.forEach((m) => lines.push(`   - ${m}`));
    lines.push('');
  }
  lines.push(' 攻击流程:');
  lines.push('  Stage 1: 用 puts@PLT 泄露 puts 在 GOT 中的实际地址');
  lines.push('           → 通过 libc 中 puts 的偏移计算 libc 基址');
  lines.push('           → 计算 system() 和 "/bin/sh" 的实际地址');
  lines.push('           → 返回 main 重新触发溢出');
  lines.push('  Stage 2: 用计算出的 system() 地址 + "/bin/sh" 地址构造 getshell');
  lines.push('');
  lines.push(' 栈布局:');
  lines.push(`  ${padStr('偏移', offWidth)}  ${padStr('地址', addrWidth)}  含义`);
  lines.push(`  ${'-'.repeat(offWidth)}  ${'-'.repeat(addrWidth)}  ${'-'.repeat(40)}`);
  rows.forEach((r) => {
    const addrStr = r.addr !== null && r.addr !== 0 ? '0x' + toHexAddr(r.addr, bits) : (r.addr === null ? '─────' : '(待填)');
    lines.push(`  ${padStr('0x' + r.off.toString(16), offWidth)}  ${padStr(addrStr, addrWidth)}  ${r.meaning}`);
  });
  lines.push('');
  lines.push(' ROP chain hex (小端序):');
  const hexStr = hexBytes.map((b) => b.toString(16).padStart(2, '0')).join('');
  const groups: string[] = [];
  for (let i = 0; i < hexStr.length; i += (bits / 8) * 2) {
    groups.push(hexStr.substring(i, i + (bits / 8) * 2));
  }
  lines.push('  ' + groups.join('\n  '));
  lines.push('');
  lines.push(' 说明:');
  lines.push('  - puts@PLT / puts@GOT / main 地址需根据实际二进制填入');
  lines.push('  - system() 和 "/bin/sh" 地址需在 libc 基址计算后填入');
  lines.push('  - 64 位需注意栈对齐 (system 内部 movaps 要求 16 字节对齐)');

  return lines.join('\n');
};

/* ---------- custom chain ---------- */

const genCustom = (gadgets: Gadget[], bits: 32 | 64): string => {
  const offWidth = 6;
  const addrWidth = bits === 64 ? 18 : 10;
  const lines: string[] = [];
  lines.push(`── 自定义 ROP 链 (${bits}位) ──`);
  lines.push('');
  lines.push(' Gadget 列表:');
  lines.push(`  ${padStr('偏移', offWidth)}  ${padStr('地址', addrWidth)}  描述`);
  lines.push(`  ${'-'.repeat(offWidth)}  ${'-'.repeat(addrWidth)}  ${'-'.repeat(40)}`);
  const hexBytes: number[] = [];
  let offset = 0;
  gadgets.forEach((g) => {
    lines.push(`  ${padStr('0x' + offset.toString(16), offWidth)}  ${padStr('0x' + toHexAddr(g.addr, bits), addrWidth)}  ${g.desc}`);
    hexBytes.push(...toBytesLE(g.addr, bits));
    offset += bits / 8;
  });
  lines.push('');
  lines.push(' ROP chain hex (小端序):');
  const hexStr = hexBytes.map((b) => b.toString(16).padStart(2, '0')).join('');
  const groups: string[] = [];
  for (let i = 0; i < hexStr.length; i += (bits / 8) * 2) {
    groups.push(hexStr.substring(i, i + (bits / 8) * 2));
  }
  lines.push('  ' + groups.join('\n  '));
  return lines.join('\n');
};

/* ---------- Execute ---------- */

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    toolName="ROP链构造辅助"
    paramsConfig={[
      {
        name: 'target',
        label: '目标',
        type: 'select',
        default: 'execve-binsh',
        options: [
          { value: 'execve-binsh', label: 'execve /bin/sh' },
          { value: 'ret2libc-puts', label: 'ret2libc (puts泄露)' },
          { value: 'ret2libc-system', label: 'ret2libc (system)' },
          { value: 'custom', label: '自定义' },
        ],
      },
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
    ]}
    modeOptions={[
      { value: 'execve', label: 'execve链' },
      { value: 'ret2libc', label: 'ret2libc' },
      { value: 'custom', label: '自定义' },
    ]}
    execute={(
      input: string,
      mode: string,
      params: Record<string, unknown>,
    ): string => {
      const arch = (params.arch === '32' ? 32 : 64) as 32 | 64;
      const target = (params.target as string) ?? 'execve-binsh';
      const gadgets = parseGadgets(input);
      if (gadgets.length === 0) {
        throw new Error('未解析到任何 gadget, 请按 "地址 | 描述" 格式逐行输入');
      }
      // mode takes precedence, fallback to target param
      let effectiveTarget = target;
      if (mode === 'execve') effectiveTarget = 'execve-binsh';
      else if (mode === 'ret2libc') effectiveTarget = 'ret2libc-puts';
      else if (mode === 'custom') effectiveTarget = 'custom';

      switch (effectiveTarget) {
        case 'execve-binsh':
          return genExecve(gadgets, arch);
        case 'ret2libc-puts':
        case 'ret2libc-system':
          return genRet2libc(gadgets, arch);
        case 'custom':
          return genCustom(gadgets, arch);
        default:
          return genExecve(gadgets, arch);
      }
    }}
  />
);

export default ToolComponent;
