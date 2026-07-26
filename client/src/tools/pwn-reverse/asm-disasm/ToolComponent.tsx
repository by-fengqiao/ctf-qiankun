import SimpleTool from '../../_shared/SimpleTool';
import { parseHex, bytesToHex } from '../../_shared/hexUtils';
import type { ToolProps } from '../../types';

/* ============================================================
 * x86 / x86-64 minimal assembler + disassembler
 * Covers CTF-common subset: mov, push, pop, call, ret, jmp,
 * je, jne, add, sub, xor, lea, nop, int, syscall
 * Intel syntax. 64-bit defaults to REX-prefixed encodings.
 * ========================================================== */

type Bits = 32 | 64;

const REG64 = [
  'rax', 'rcx', 'rdx', 'rbx', 'rsp', 'rbp', 'rsi', 'rdi',
  'r8', 'r9', 'r10', 'r11', 'r12', 'r13', 'r14', 'r15',
];
const REG32 = [
  'eax', 'ecx', 'edx', 'ebx', 'esp', 'ebp', 'esi', 'edi',
  'r8d', 'r9d', 'r10d', 'r11d', 'r12d', 'r13d', 'r14d', 'r15d',
];
const REG16 = [
  'ax', 'cx', 'dx', 'bx', 'sp', 'bp', 'si', 'di',
  'r8w', 'r9w', 'r10w', 'r11w', 'r12w', 'r13w', 'r14w', 'r15w',
];
const REG8 = [
  'al', 'cl', 'dl', 'bl', 'spl', 'bpl', 'sil', 'dil',
  'r8b', 'r9b', 'r10b', 'r11b', 'r12b', 'r13b', 'r14b', 'r15b',
];

const regIndexOf = (name: string): { idx: number; size: number } | null => {
  const lower = name.toLowerCase();
  let i = REG64.indexOf(lower);
  if (i >= 0) return { idx: i, size: 64 };
  i = REG32.indexOf(lower);
  if (i >= 0) return { idx: i, size: 32 };
  i = REG16.indexOf(lower);
  if (i >= 0) return { idx: i, size: 16 };
  i = REG8.indexOf(lower);
  if (i >= 0) return { idx: i, size: 8 };
  return null;
};

const parseImm = (tok: string): number | null => {
  const t = tok.trim();
  if (t === '') return null;
  let n: number;
  if (/^0x[0-9a-f]+$/i.test(t)) {
    n = parseInt(t.slice(2), 16);
  } else if (/^[0-9]+$/i.test(t)) {
    n = parseInt(t, 10);
  } else if (/^0b[01]+$/i.test(t)) {
    n = parseInt(t.slice(2), 2);
  } else {
    return null;
  }
  if (Number.isNaN(n)) return null;
  return n;
};

const parseMemRef = (tok: string): { base: string | null; disp: number } | null => {
  // [reg] or [reg+disp] or [reg-disp] or [disp]
  const m = tok.match(/^\[\s*(.+?)\s*\]$/);
  if (!m) return null;
  const inner = m[1].trim();
  const plus = inner.indexOf('+');
  const minus = inner.indexOf('-');
  if (plus > 0) {
    const base = inner.substring(0, plus).trim();
    const disp = parseImm(inner.substring(plus + 1));
    if (disp === null) return null;
    return { base, disp };
  }
  if (minus > 0) {
    const base = inner.substring(0, minus).trim();
    const disp = parseImm(inner.substring(minus + 1));
    if (disp === null) return null;
    return { base, disp: -disp };
  }
  const v = parseImm(inner);
  if (v !== null) return { base: null, disp: v };
  return { base: inner, disp: 0 };
};

/* ---------- Encoder helpers ---------- */

const encodeImm = (val: number, size: number): number[] => {
  const bytes: number[] = [];
  const nbytes = size / 8;
  // convert to unsigned representation
  const u = val < 0 ? val + 2 ** size : val;
  for (let i = 0; i < nbytes; i++) {
    bytes.push((u >>> (i * 8)) & 0xff);
  }
  return bytes;
};

const rexPrefix = (w: boolean, r: number, x: number, b: number): number[] => {
  let rex = 0x40;
  if (w) rex |= 0x08;
  if (r) rex |= 0x04;
  if (x) rex |= 0x02;
  if (b) rex |= 0x01;
  if (rex === 0x40) return []; // no REX needed unless r/x/b set
  return [rex];
};

const modrm = (mod: number, reg: number, rm: number): number => {
  return ((mod & 0x3) << 6) | ((reg & 0x7) << 3) | (rm & 0x7);
};

const sib = (scale: number, index: number, base: number): number => {
  return ((scale & 0x3) << 6) | ((index & 0x7) << 3) | (base & 0x7);
};

/* ---------- Assemble one line ---------- */

interface AssembleResult {
  bytes: number[];
  note?: string;
}

const assembleLine = (line: string, bits: Bits): AssembleResult => {
  // strip comments
  const noComment = line.split(';')[0].split('#')[0].trim();
  if (noComment === '') return { bytes: [] };

  // mnemonic + rest
  const wsMatch = /\s/.exec(noComment);
  const sp = wsMatch ? wsMatch.index : -1;
  let mnemonic: string;
  let rest: string;
  if (sp < 0) {
    mnemonic = noComment.toLowerCase();
    rest = '';
  } else {
    mnemonic = noComment.substring(0, sp).toLowerCase();
    rest = noComment.substring(sp + 1).trim();
  }

  const operands = rest === '' ? [] : rest.split(',').map((s) => s.trim());

  // NOP
  if (mnemonic === 'nop') return { bytes: [0x90] };

  // RET
  if (mnemonic === 'ret') {
    if (bits === 64) return { bytes: [0xc3] };
    return { bytes: [0xc3] };
  }

  // SYSCALL (64-bit only)
  if (mnemonic === 'syscall') {
    return { bytes: [0x0f, 0x05] };
  }

  // INT
  if (mnemonic === 'int' || mnemonic === 'int0' || mnemonic === 'int3') {
    if (mnemonic === 'int3' || (operands.length === 1 && operands[0] === '3')) {
      return { bytes: [0xcc] };
    }
    if (operands.length === 1) {
      const v = parseImm(operands[0]);
      if (v !== null && v >= 0 && v <= 0xff) {
        return { bytes: [0xcd, v & 0xff] };
      }
    }
    throw new Error(`int 编码失败: ${line}`);
  }

  // PUSH / POP
  if (mnemonic === 'push' || mnemonic === 'pop') {
    if (operands.length !== 1) throw new Error(`${mnemonic} 需要1个操作数: ${line}`);
    const op = operands[0];
    // push imm8 / imm32
    const imm = parseImm(op);
    if (imm !== null && mnemonic === 'push') {
      if (imm >= -0x80 && imm <= 0x7f) return { bytes: [0x6a, imm & 0xff] };
      if (imm >= -0x80000000 && imm <= 0x7fffffff) {
        return { bytes: [0x68, ...encodeImm(imm, 32)] };
      }
    }
    const r = regIndexOf(op);
    if (r) {
      if (r.idx < 8) {
        const base = mnemonic === 'push' ? 0x50 : 0x58;
        return { bytes: [base + r.idx] };
      }
      // extended register, needs REX.B
      const base = mnemonic === 'push' ? 0x50 : 0x58;
      return { bytes: [...rexPrefix(bits === 64, 0, 0, 1), base + (r.idx & 0x7)] };
    }
    throw new Error(`${mnemonic} 操作数不支持: ${line}`);
  }

  // JMP rel8/rel32
  if (mnemonic === 'jmp') {
    if (operands.length !== 1) throw new Error(`jmp 需要1个操作数: ${line}`);
    const target = parseImm(operands[0]);
    if (target === null) throw new Error(`jmp 仅支持立即目标: ${line}`);
    // we cannot know current address in this single-line encoder;
    // emit rel32 form with placeholder 0
    void target;
    return { bytes: [0xe9, 0, 0, 0, 0], note: 'rel32占位(目标地址需整体回填)' };
  }

  // Conditional jumps: je / jne
  if (mnemonic === 'je' || mnemonic === 'jz') {
    return { bytes: [0x74, 0], note: 'rel8占位' };
  }
  if (mnemonic === 'jne' || mnemonic === 'jnz') {
    return { bytes: [0x75, 0], note: 'rel8占位' };
  }

  // CALL rel32
  if (mnemonic === 'call') {
    if (operands.length !== 1) throw new Error(`call 需要1个操作数: ${line}`);
    const target = parseImm(operands[0]);
    if (target !== null) {
      return { bytes: [0xe8, 0, 0, 0, 0], note: 'rel32占位(目标地址需整体回填)' };
    }
    // call reg
    const r = regIndexOf(operands[0]);
    if (r) {
      const rex = r.idx >= 8 ? rexPrefix(bits === 64, 0, 0, 1) : (bits === 64 ? rexPrefix(true, 0, 0, 0) : []);
      return { bytes: [...rex, 0xff, modrm(3, 2, r.idx & 0x7)] };
    }
    throw new Error(`call 操作数不支持: ${line}`);
  }

  // XOR / ADD / SUB reg, reg|imm
  if (mnemonic === 'xor' || mnemonic === 'add' || mnemonic === 'sub') {
    if (operands.length !== 2) throw new Error(`${mnemonic} 需要2个操作数: ${line}`);
    const [dstStr, srcStr] = operands;
    const dst = regIndexOf(dstStr);
    if (!dst) throw new Error(`不支持的寄存器: ${dstStr}`);
    const opcodeMap: Record<string, number> = { add: 0x00, sub: 0x28, xor: 0x30 };
    const opcodeBase = opcodeMap[mnemonic];

    // reg, imm
    const imm = parseImm(srcStr);
    if (imm !== null) {
      // 8-bit immediate
      if (imm >= -0x80 && imm <= 0x7f) {
        const opc = 0x80 | (dst.size === 8 ? 0 : 4); // /0(add)=0x80 /5(sub)=0x80 /6(xor)=0x80 with reg field
        const regField: Record<string, number> = { add: 0, sub: 5, xor: 6 };
        const rex = dst.size === 64 ? rexPrefix(true, 0, 0, dst.idx >= 8 ? 1 : 0)
          : (dst.idx >= 8 ? rexPrefix(false, 0, 0, 1) : []);
        const rmByte = modrm(3, regField[mnemonic], dst.idx & 0x7);
        if (dst.size === 8) {
          return { bytes: [...rex, 0x80, rmByte, imm & 0xff] };
        }
        void opc;
        return { bytes: [...rex, 0x83, rmByte, imm & 0xff] };
      }
      // 32-bit immediate
      const regField: Record<string, number> = { add: 0, sub: 5, xor: 6 };
      const rex = dst.size === 64 ? rexPrefix(true, 0, 0, dst.idx >= 8 ? 1 : 0)
        : (dst.idx >= 8 ? rexPrefix(false, 0, 0, 1) : []);
      const rmByte = modrm(3, regField[mnemonic], dst.idx & 0x7);
      const imms = dst.size === 8 ? encodeImm(imm, 8) : encodeImm(imm, 32);
      return { bytes: [...rex, 0x81, rmByte, ...imms] };
    }

    const src = regIndexOf(srcStr);
    if (!src) throw new Error(`不支持的源操作数: ${srcStr}`);
    if (dst.size !== src.size) throw new Error(`寄存器大小不匹配: ${line}`);

    const regField = dst.idx; // in reg field
    const rmField = src.idx;
    const rexW = dst.size === 64;
    const rexR = regField >= 8 ? 1 : 0;
    const rexB = rmField >= 8 ? 1 : 0;
    const rex = rexPrefix(rexW, rexR, 0, rexB);
    // opcode: add=0x01 sub=0x29 xor=0x31 (reg->rm, ModRM) for >8bit; for 8bit 0x00/0x28/0x30
    const opcBase = dst.size === 8 ? opcodeBase : opcodeBase + 1;
    const mr = modrm(3, regField & 0x7, rmField & 0x7);
    return { bytes: [...rex, opcBase, mr] };
  }

  // MOV
  if (mnemonic === 'mov') {
    if (operands.length !== 2) throw new Error(`mov 需要2个操作数: ${line}`);
    const [dstStr, srcStr] = operands;
    const dst = regIndexOf(dstStr);

    // mov reg, imm
    const imm = parseImm(srcStr);
    if (dst && imm !== null) {
      const rex = dst.size === 64
        ? rexPrefix(true, 0, 0, dst.idx >= 8 ? 1 : 0)
        : (dst.idx >= 8 ? rexPrefix(false, 0, 0, 1) : []);
      const opc = dst.size === 8 ? 0xb0 : 0xb8;
      const imms = dst.size === 64
        ? (() => {
            // mov r64, imm64 (0xB8 + REX.W)
            const u = imm < 0 ? imm + 2 ** 64 : imm;
            const arr: number[] = [];
            for (let i = 0; i < 8; i++) arr.push(Number((BigInt(u) >> BigInt(i * 8)) & 0xffn));
            return arr;
          })()
        : encodeImm(imm, dst.size === 8 ? 8 : 32);
      return { bytes: [...rex, opc + (dst.idx & 0x7), ...imms] };
    }

    // mov reg, [mem]
    if (dst) {
      const mem = parseMemRef(srcStr);
      if (mem) {
        if (mem.base === null) {
          // mov reg, [disp32]  (absolute, 32-bit displacement)
          const rex = dst.size === 64
            ? rexPrefix(true, dst.idx >= 8 ? 1 : 0, 0, 0)
            : (dst.idx >= 8 ? rexPrefix(false, dst.idx >= 8 ? 1 : 0, 0, 0) : []);
          const opc = dst.size === 8 ? 0x8a : 0x8b;
          const disp = encodeImm(mem.disp, 32);
          return { bytes: [...rex, opc, modrm(0, dst.idx & 0x7, 5), ...disp] };
        }
        const baseReg = regIndexOf(mem.base);
        if (!baseReg) throw new Error(`内存基址寄存器不支持: ${mem.base}`);
        if (baseReg.size !== 64 && bits === 64) {
          throw new Error(`64位模式下基址寄存器需为64位: ${line}`);
        }
        const rex = rexPrefix(
          dst.size === 64,
          dst.idx >= 8 ? 1 : 0,
          0,
          baseReg.idx >= 8 ? 1 : 0,
        );
        const opc = dst.size === 8 ? 0x8a : 0x8b;
        // disp fits in 8 bits
        if (mem.disp >= -0x80 && mem.disp <= 0x7f && mem.disp !== 0) {
          return {
            bytes: [...rex, opc, modrm(1, dst.idx & 0x7, baseReg.idx & 0x7), mem.disp & 0xff],
          };
        }
        // disp == 0 and base != RBP/R13
        if (mem.disp === 0 && (baseReg.idx & 0x7) !== 5) {
          return { bytes: [...rex, opc, modrm(0, dst.idx & 0x7, baseReg.idx & 0x7)] };
        }
        // disp32
        const disp = encodeImm(mem.disp, 32);
        return {
          bytes: [...rex, opc, modrm(2, dst.idx & 0x7, baseReg.idx & 0x7), ...disp],
        };
      }

      // mov reg, reg
      const src = regIndexOf(srcStr);
      if (src) {
        if (dst.size !== src.size) throw new Error(`寄存器大小不匹配: ${line}`);
        const rex = rexPrefix(
          dst.size === 64,
          dst.idx >= 8 ? 1 : 0,
          0,
          src.idx >= 8 ? 1 : 0,
        );
        const opc = dst.size === 8 ? 0x88 : 0x89;
        // mov reg, reg  (rm <- reg) uses 0x89 /r, dst in reg field
        return { bytes: [...rex, opc, modrm(3, dst.idx & 0x7, src.idx & 0x7)] };
      }
    }

    // mov [mem], reg
    const mem = parseMemRef(dstStr);
    if (mem) {
      const src = regIndexOf(srcStr);
      if (src) {
        if (mem.base === null) {
          const rex = src.size === 64
            ? rexPrefix(true, src.idx >= 8 ? 1 : 0, 0, 0)
            : (src.idx >= 8 ? rexPrefix(false, src.idx >= 8 ? 1 : 0, 0, 0) : []);
          const opc = src.size === 8 ? 0x88 : 0x89;
          const disp = encodeImm(mem.disp, 32);
          return { bytes: [...rex, opc, modrm(0, src.idx & 0x7, 5), ...disp] };
        }
        const baseReg = regIndexOf(mem.base);
        if (!baseReg) throw new Error(`内存基址寄存器不支持: ${mem.base}`);
        const rex = rexPrefix(
          src.size === 64,
          src.idx >= 8 ? 1 : 0,
          0,
          baseReg.idx >= 8 ? 1 : 0,
        );
        const opc = src.size === 8 ? 0x88 : 0x89;
        if (mem.disp >= -0x80 && mem.disp <= 0x7f && mem.disp !== 0) {
          return {
            bytes: [...rex, opc, modrm(1, src.idx & 0x7, baseReg.idx & 0x7), mem.disp & 0xff],
          };
        }
        if (mem.disp === 0 && (baseReg.idx & 0x7) !== 5) {
          return { bytes: [...rex, opc, modrm(0, src.idx & 0x7, baseReg.idx & 0x7)] };
        }
        const disp = encodeImm(mem.disp, 32);
        return {
          bytes: [...rex, opc, modrm(2, src.idx & 0x7, baseReg.idx & 0x7), ...disp],
        };
      }
    }

    throw new Error(`mov 操作数组合不支持: ${line}`);
  }

  // LEA reg, [mem]
  if (mnemonic === 'lea') {
    if (operands.length !== 2) throw new Error(`lea 需要2个操作数: ${line}`);
    const dst = regIndexOf(operands[0]);
    if (!dst) throw new Error(`lea 目标必须是寄存器: ${line}`);
    const mem = parseMemRef(operands[1]);
    if (!mem) throw new Error(`lea 源必须是内存引用: ${line}`);
    if (mem.base === null) {
      const rex = rexPrefix(
        dst.size === 64,
        dst.idx >= 8 ? 1 : 0,
        0,
        0,
      );
      const disp = encodeImm(mem.disp, 32);
      return { bytes: [...rex, 0x8d, modrm(0, dst.idx & 0x7, 5), ...disp] };
    }
    const baseReg = regIndexOf(mem.base);
    if (!baseReg) throw new Error(`内存基址寄存器不支持: ${mem.base}`);
    const rex = rexPrefix(
      dst.size === 64,
      dst.idx >= 8 ? 1 : 0,
      0,
      baseReg.idx >= 8 ? 1 : 0,
    );
    if (mem.disp >= -0x80 && mem.disp <= 0x7f && mem.disp !== 0) {
      return { bytes: [...rex, 0x8d, modrm(1, dst.idx & 0x7, baseReg.idx & 0x7), mem.disp & 0xff] };
    }
    if (mem.disp === 0 && (baseReg.idx & 0x7) !== 5) {
      return { bytes: [...rex, 0x8d, modrm(0, dst.idx & 0x7, baseReg.idx & 0x7)] };
    }
    const disp = encodeImm(mem.disp, 32);
    return { bytes: [...rex, 0x8d, modrm(2, dst.idx & 0x7, baseReg.idx & 0x7), ...disp] };
  }

  throw new Error(`不支持的指令: ${line}`);
};

/* ---------- Disassemble one instruction ---------- */

interface DisasmResult {
  bytes: number[];
  text: string;
  size: number;
}

const disasmOne = (bytes: Uint8Array, off: number, bits: Bits): DisasmResult => {
  const b0 = bytes[off];

  // NOP
  if (b0 === 0x90) return { bytes: [0x90], text: 'nop', size: 1 };

  // RET
  if (b0 === 0xc3) return { bytes: [0xc3], text: 'ret', size: 1 };

  // INT3
  if (b0 === 0xcc) return { bytes: [0xcc], text: 'int3', size: 1 };

  // INT imm8
  if (b0 === 0xcd) {
    return { bytes: [0xcd, bytes[off + 1]], text: `int 0x${bytes[off + 1].toString(16)}`, size: 2 };
  }

  // SYSCALL (0F 05)
  if (b0 === 0x0f && bytes[off + 1] === 0x05) {
    return { bytes: [0x0f, 0x05], text: 'syscall', size: 2 };
  }

  // PUSH/POP reg (50-5F)
  if (b0 >= 0x50 && b0 <= 0x57) {
    return { bytes: [b0], text: `push ${REG64[b0 - 0x50]}`, size: 1 };
  }
  if (b0 >= 0x58 && b0 <= 0x5f) {
    return { bytes: [b0], text: `pop ${REG64[b0 - 0x58]}`, size: 1 };
  }

  // PUSH imm8 / imm32
  if (b0 === 0x6a) {
    const v = bytes[off + 1];
    const sv = v > 0x7f ? v - 0x100 : v;
    return { bytes: [0x6a, v], text: `push ${sv}`, size: 2 };
  }
  if (b0 === 0x68) {
    const v = readU32LEArr(bytes, off + 1);
    return { bytes: [0x68, bytes[off+1], bytes[off+2], bytes[off+3], bytes[off+4]], text: `push 0x${(v >>> 0).toString(16)}`, size: 5 };
  }

  // JMP rel32
  if (b0 === 0xe9) {
    const rel = readU32LEArr(bytes, off + 1);
    const target = (off + 5 + rel) >>> 0;
    return {
      bytes: [0xe9, bytes[off+1], bytes[off+2], bytes[off+3], bytes[off+4]],
      text: `jmp 0x${target.toString(16)}`,
      size: 5,
    };
  }

  // JE/JNE rel8
  if (b0 === 0x74) {
    const rel = bytes[off + 1];
    const sv = rel > 0x7f ? rel - 0x100 : rel;
    const target = (off + 2 + sv) >>> 0;
    return { bytes: [0x74, rel], text: `je 0x${target.toString(16)}`, size: 2 };
  }
  if (b0 === 0x75) {
    const rel = bytes[off + 1];
    const sv = rel > 0x7f ? rel - 0x100 : rel;
    const target = (off + 2 + sv) >>> 0;
    return { bytes: [0x75, rel], text: `jne 0x${target.toString(16)}`, size: 2 };
  }

  // CALL rel32
  if (b0 === 0xe8) {
    const rel = readU32LEArr(bytes, off + 1);
    const target = (off + 5 + rel) >>> 0;
    return {
      bytes: [0xe8, bytes[off+1], bytes[off+2], bytes[off+3], bytes[off+4]],
      text: `call 0x${target.toString(16)}`,
      size: 5,
    };
  }

  // mov reg, imm (B8-BF / B0-B7)  with optional REX
  let cursor = off;
  let rex = 0;
  if (b0 >= 0x41 && b0 <= 0x4f) {
    rex = b0;
    cursor++;
  }
  const w = (rex & 0x08) !== 0;
  const rExt = (rex & 0x04) !== 0;
  const bExt = (rex & 0x01) !== 0;
  const b1 = bytes[cursor];

  if (b1 >= 0xb8 && b1 <= 0xbf) {
    const idx = (b1 - 0xb8) | (bExt ? 8 : 0);
    if (w) {
      // 64-bit imm
      let v = 0n;
      for (let i = 0; i < 8; i++) v |= BigInt(bytes[cursor + 1 + i]) << BigInt(i * 8);
      const used = [b0, ...bytes.slice(cursor + 1, cursor + 9)];
      if (rex === 0) used.shift();
      return { bytes: used, text: `mov ${REG64[idx]}, 0x${v.toString(16)}`, size: used.length };
    }
    const v = readU32LEArr(bytes, cursor + 1);
    const regName = bits === 64 ? REG64[idx] : REG32[idx];
    const used = [b0, ...bytes.slice(cursor + 1, cursor + 5)];
    if (rex === 0) used.shift();
    return { bytes: used, text: `mov ${regName}, 0x${(v >>> 0).toString(16)}`, size: used.length };
  }
  if (b1 >= 0xb0 && b1 <= 0xb7) {
    const idx = (b1 - 0xb0) | (bExt ? 8 : 0);
    const v = bytes[cursor + 1];
    const used = rex !== 0 ? [rex, b1, v] : [b1, v];
    return { bytes: used, text: `mov ${REG8[idx]}, 0x${v.toString(16)}`, size: used.length };
  }

  // ModRM-based: 0x88/0x89 (mov), 0x01/0x29/0x31 (add/sub/xor), 0x8d (lea), 0xFF /2 (call), 0xFF /6 (push)
  const modrmByte = bytes[cursor + 1];
  const mod = (modrmByte >> 6) & 0x3;
  const reg = ((modrmByte >> 3) & 0x7) | (rExt ? 8 : 0);
  const rm = modrmByte & 0x7;
  const rmFull = rm | (bExt ? 8 : 0);

  const regName = (idx: number, size: number): string => {
    if (size === 64) return REG64[idx];
    if (size === 32) return REG32[idx];
    if (size === 16) return REG16[idx];
    return REG8[idx];
  };

  // helper: read memory operand from ModRM
  const readMemOp = (): { text: string; bytes: number[] } => {
    if (mod === 3) {
      return { text: '', bytes: [] }; // register direct, handled by caller
    }
    // 64-bit mode uses SIB when rm == 4
    if (bits === 64 && rm === 4) {
      const sibByte = bytes[cursor + 2];
      const scale = (sibByte >> 6) & 0x3;
      const index = (sibByte >> 3) & 0x7;
      const base = sibByte & 0x7;
      const scaleStr = ['1', '2', '4', '8'][scale];
      let disp = 0;
      let dispBytes: number[] = [];
      let dispSize = 0;
      if (mod === 0 && base === 5) {
        disp = readU32LEArr(bytes, cursor + 3);
        dispBytes = [bytes[cursor+2], bytes[cursor+3], bytes[cursor+4], bytes[cursor+5], bytes[cursor+6]];
        dispSize = 5;
      } else if (mod === 1) {
        disp = bytes[cursor + 3];
        if (disp > 0x7f) disp -= 0x100;
        dispBytes = [bytes[cursor+2], bytes[cursor+3]];
        dispSize = 2;
      } else if (mod === 2) {
        disp = readU32LEArr(bytes, cursor + 3);
        dispBytes = [bytes[cursor+2], bytes[cursor+3], bytes[cursor+4], bytes[cursor+5], bytes[cursor+6]];
        dispSize = 5;
      } else {
        dispBytes = [bytes[cursor+2]];
        dispSize = 1;
      }
      const baseName = REG64[base | (bExt ? 8 : 0)];
      const indexName = REG64[index];
      const memStr = `[${baseName}${index ? '+' + indexName + '*' + scaleStr : ''}${disp !== 0 ? (disp > 0 ? '+' : '') + disp : ''}]`;
      return { text: memStr, bytes: dispBytes };
    }
    if (mod === 0 && rm === 5) {
      // 32-bit displacement, no base
      const disp = readU32LEArr(bytes, cursor + 2);
      return {
        text: `[0x${(disp >>> 0).toString(16)}]`,
        bytes: [bytes[cursor+1], bytes[cursor+2], bytes[cursor+3], bytes[cursor+4], bytes[cursor+5]],
      };
    }
    let disp = 0;
    let dispBytes: number[] = [];
    let dispSize = 0;
    if (mod === 1) {
      disp = bytes[cursor + 2];
      if (disp > 0x7f) disp -= 0x100;
      dispBytes = [bytes[cursor+2]];
      dispSize = 1;
    } else if (mod === 2) {
      disp = readU32LEArr(bytes, cursor + 2);
      dispBytes = [bytes[cursor+2], bytes[cursor+3], bytes[cursor+4], bytes[cursor+5]];
      dispSize = 4;
    }
    const baseName = bits === 64 ? REG64[rmFull] : REG32[rmFull];
    const memStr = `[${baseName}${disp !== 0 ? (disp > 0 ? '+' : '') + disp : ''}]`;
    return { text: memStr, bytes: [bytes[cursor+1], ...dispBytes] };
  };

  // MOV r/m, r  (0x89) / r, r/m (0x8B)
  if (b1 === 0x89) {
    const size = w ? 64 : 32;
    if (mod === 3) {
      const used = rex !== 0 ? [rex, b1, modrmByte] : [b1, modrmByte];
      return { bytes: used, text: `mov ${regName(rmFull, size)}, ${regName(reg, size)}`, size: used.length };
    }
    const mem = readMemOp();
    const used = rex !== 0 ? [rex, b1, ...mem.bytes] : [b1, ...mem.bytes];
    return { bytes: used, text: `mov ${mem.text}, ${regName(reg, size)}`, size: used.length };
  }
  if (b1 === 0x8b) {
    const size = w ? 64 : 32;
    if (mod === 3) {
      const used = rex !== 0 ? [rex, b1, modrmByte] : [b1, modrmByte];
      return { bytes: used, text: `mov ${regName(reg, size)}, ${regName(rmFull, size)}`, size: used.length };
    }
    const mem = readMemOp();
    const used = rex !== 0 ? [rex, b1, ...mem.bytes] : [b1, ...mem.bytes];
    return { bytes: used, text: `mov ${regName(reg, size)}, ${mem.text}`, size: used.length };
  }
  if (b1 === 0x88) {
    if (mod === 3) {
      const used = rex !== 0 ? [rex, b1, modrmByte] : [b1, modrmByte];
      return { bytes: used, text: `mov ${REG8[rmFull]}, ${REG8[reg]}`, size: used.length };
    }
    const mem = readMemOp();
    const used = rex !== 0 ? [rex, b1, ...mem.bytes] : [b1, ...mem.bytes];
    return { bytes: used, text: `mov ${mem.text}, ${REG8[reg]}`, size: used.length };
  }
  if (b1 === 0x8a) {
    if (mod === 3) {
      const used = rex !== 0 ? [rex, b1, modrmByte] : [b1, modrmByte];
      return { bytes: used, text: `mov ${REG8[reg]}, ${REG8[rmFull]}`, size: used.length };
    }
    const mem = readMemOp();
    const used = rex !== 0 ? [rex, b1, ...mem.bytes] : [b1, ...mem.bytes];
    return { bytes: used, text: `mov ${REG8[reg]}, ${mem.text}`, size: used.length };
  }

  // ADD/SUB/XOR (0x01/0x29/0x31 r/m, r)
  if (b1 === 0x01 || b1 === 0x29 || b1 === 0x31) {
    const nameMap: Record<number, string> = { 0x01: 'add', 0x29: 'sub', 0x31: 'xor' };
    const name = nameMap[b1];
    const size = w ? 64 : 32;
    if (mod === 3) {
      const used = rex !== 0 ? [rex, b1, modrmByte] : [b1, modrmByte];
      return { bytes: used, text: `${name} ${regName(rmFull, size)}, ${regName(reg, size)}`, size: used.length };
    }
    const mem = readMemOp();
    const used = rex !== 0 ? [rex, b1, ...mem.bytes] : [b1, ...mem.bytes];
    return { bytes: used, text: `${name} ${mem.text}, ${regName(reg, size)}`, size: used.length };
  }
  // ADD/SUB/XOR with imm (0x83 /digit, 0x81 /digit)
  if (b1 === 0x83 || b1 === 0x81) {
    const nameMap: Record<number, string> = { 0: 'add', 5: 'sub', 6: 'xor', 4: 'and', 1: 'or' };
    const name = nameMap[reg];
    if (name) {
      const size = w ? 64 : 32;
      const immSize = b1 === 0x83 ? 1 : 4;
      let immVal: number;
      let immBytes: number[];
      if (immSize === 1) {
        immVal = bytes[cursor + 2 + (mod === 3 ? 0 : (bytes[cursor+2] === undefined ? 0 : 0))];
        // For mod==3, imm follows modrm
        const immOff = cursor + 2;
        immVal = bytes[immOff];
        if (immVal > 0x7f) immVal -= 0x100;
        immBytes = [bytes[immOff]];
      } else {
        const immOff = cursor + 2;
        immVal = readU32LEArr(bytes, immOff);
        immBytes = [bytes[immOff], bytes[immOff+1], bytes[immOff+2], bytes[immOff+3]];
      }
      if (mod === 3) {
        const used = rex !== 0 ? [rex, b1, modrmByte, ...immBytes] : [b1, modrmByte, ...immBytes];
        return { bytes: used, text: `${name} ${regName(rmFull, size)}, ${immVal}`, size: used.length };
      }
      // memory operand - need to compute disp bytes
      const dispSize = mod === 1 ? 1 : (mod === 2 ? 4 : 0);
      const dispBytes = dispSize > 0 ? Array.from(bytes.slice(cursor + 2, cursor + 2 + dispSize)) : [];
      const immOff = cursor + 2 + dispSize;
      if (immSize === 1) {
        immVal = bytes[immOff];
        if (immVal > 0x7f) immVal -= 0x100;
        immBytes = [bytes[immOff]];
      } else {
        immVal = readU32LEArr(bytes, immOff);
        immBytes = [bytes[immOff], bytes[immOff+1], bytes[immOff+2], bytes[immOff+3]];
      }
      const used = rex !== 0 ? [rex, b1, modrmByte, ...dispBytes, ...immBytes] : [b1, modrmByte, ...dispBytes, ...immBytes];
      // reconstruct mem text
      const memBaseName = bits === 64 ? REG64[rmFull] : REG32[rmFull];
      const disp = dispSize === 1 ? (bytes[cursor+2] > 0x7f ? bytes[cursor+2] - 0x100 : bytes[cursor+2]) : (dispSize === 4 ? readU32LEArr(bytes, cursor+2) : 0);
      const memText = `[${memBaseName}${disp !== 0 ? (disp > 0 ? '+' : '') + disp : ''}]`;
      return { bytes: used, text: `${name} ${memText}, ${immVal}`, size: used.length };
    }
  }

  // LEA (0x8d)
  if (b1 === 0x8d) {
    const size = w ? 64 : 32;
    const mem = readMemOp();
    if (mem.text === '') {
      const used = rex !== 0 ? [rex, b1, modrmByte] : [b1, modrmByte];
      return { bytes: used, text: `lea ${regName(reg, size)}, ${regName(rmFull, size)}`, size: used.length };
    }
    const used = rex !== 0 ? [rex, b1, ...mem.bytes] : [b1, ...mem.bytes];
    return { bytes: used, text: `lea ${regName(reg, size)}, ${mem.text}`, size: used.length };
  }

  // FF /2 call r/m, FF /6 push r/m
  if (b1 === 0xff) {
    if (reg === 2) {
      if (mod === 3) {
        const used = rex !== 0 ? [rex, b1, modrmByte] : [b1, modrmByte];
        return { bytes: used, text: `call ${bits === 64 ? REG64[rmFull] : REG32[rmFull]}`, size: used.length };
      }
      const mem = readMemOp();
      const used = rex !== 0 ? [rex, b1, ...mem.bytes] : [b1, ...mem.bytes];
      return { bytes: used, text: `call ${mem.text}`, size: used.length };
    }
    if (reg === 6) {
      if (mod === 3) {
        const used = rex !== 0 ? [rex, b1, modrmByte] : [b1, modrmByte];
        return { bytes: used, text: `push ${bits === 64 ? REG64[rmFull] : REG32[rmFull]}`, size: used.length };
      }
      const mem = readMemOp();
      const used = rex !== 0 ? [rex, b1, ...mem.bytes] : [b1, ...mem.bytes];
      return { bytes: used, text: `push ${mem.text}`, size: used.length };
    }
  }

  // Unknown
  const used = rex !== 0 ? [rex, b1] : [b1];
  return {
    bytes: used,
    text: `.byte 0x${used.map((b) => b.toString(16).padStart(2, '0')).join(' ')}  ; 未识别`,
    size: used.length,
  };
};

const readU32LEArr = (bytes: Uint8Array, off: number): number => {
  return (
    bytes[off] |
    (bytes[off + 1] << 8) |
    (bytes[off + 2] << 16) |
    (bytes[off + 3] << 24)
  );
};

/* ---------- Top-level execute ---------- */

const assemble = (text: string, bits: Bits): string => {
  const lines = text.split('\n');
  const outBytes: number[] = [];
  const notes: string[] = [];
  lines.forEach((line, idx) => {
    try {
      const r = assembleLine(line, bits);
      outBytes.push(...r.bytes);
      if (r.note) notes.push(`L${idx + 1}: ${r.note}`);
    } catch (e) {
      notes.push(`L${idx + 1}: 错误 - ${e instanceof Error ? e.message : '未知错误'}`);
    }
  });
  const hex = bytesToHex(new Uint8Array(outBytes));
  let result = `── 汇编结果 (${bits}位) ──\n\n${hex}\n`;
  if (notes.length > 0) {
    result += `\n── 提示 ──\n${notes.join('\n')}\n`;
  }
  return result;
};

const disassemble = (text: string, bits: Bits): string => {
  const bytes = parseHex(text);
  const L: string[] = [];
  L.push(`── 反汇编结果 (${bits}位, 小端序) ──`);
  L.push('');
  let off = 0;
  while (off < bytes.length) {
    try {
      const r = disasmOne(bytes, off, bits);
      if (r.size === 0) {
        L.push(`${off.toString(16).padStart(4, '0')}  ${bytes[off].toString(16).padStart(2, '0')}  .byte 0x${bytes[off].toString(16).padStart(2, '0')}`);
        off += 1;
        continue;
      }
      const hexBytes = Array.from(r.bytes).map((b) => b.toString(16).padStart(2, '0')).join(' ');
      L.push(`${off.toString(16).padStart(4, '0')}  ${hexBytes.padEnd(20)}  ${r.text}`);
      off += r.size;
    } catch (e) {
      L.push(`${off.toString(16).padStart(4, '0')}  ${bytes[off].toString(16).padStart(2, '0')}  ; 错误 - ${e instanceof Error ? e.message : '未知错误'}`);
      off += 1;
    }
  }
  return L.join('\n');
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    toolName="x86汇编反汇编"
    paramsConfig={[
      {
        name: 'bits',
        label: '位数',
        type: 'select',
        default: '64',
        options: [
          { value: '32', label: '32位' },
          { value: '64', label: '64位' },
        ],
      },
    ]}
    modeOptions={[
      { value: 'assemble', label: '汇编' },
      { value: 'disassemble', label: '反汇编' },
    ]}
    execute={(
      input: string,
      mode: string,
      params: Record<string, unknown>,
    ): string => {
      const bits = (params.bits === '32' ? 32 : 64) as Bits;
      if (mode === 'disassemble') {
        return disassemble(input, bits);
      }
      return assemble(input, bits);
    }}
  />
);

export default ToolComponent;
