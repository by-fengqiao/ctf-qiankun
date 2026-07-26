import SimpleTool from '../../_shared/SimpleTool';
import { parseHex } from '../../_shared/hexUtils';
import type { ToolProps } from '../../types';

/* ---------- ARM disassembler ---------- */

const REG_NAMES = [
  'r0', 'r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7',
  'r8', 'r9', 'r10', 'r11', 'r12', 'sp', 'lr', 'pc',
];

const REG_NAMES_64 = [
  'x0', 'x1', 'x2', 'x3', 'x4', 'x5', 'x6', 'x7',
  'x8', 'x9', 'x10', 'x11', 'x12', 'x13', 'x14', 'x15',
  'x16', 'x17', 'x18', 'x19', 'x20', 'x21', 'x22', 'x23',
  'x24', 'x25', 'x26', 'x27', 'x28', 'fp', 'lr', 'sp',
];

const COND_NAMES = [
  'eq', 'ne', 'cs', 'cc', 'mi', 'pl', 'vs', 'vc',
  'hi', 'ls', 'ge', 'lt', 'gt', 'le', '', 'nv',
];

const bits = (val: number, hi: number, lo: number): number => {
  const mask = (1 << (hi - lo + 1)) - 1;
  return (val >>> lo) & mask;
};

const signExtend = (val: number, width: number): number => {
  const shift = 32 - width;
  return (val << shift) >> shift;
};

/* ---------- ARM32 (A32) decoding ---------- */

const disasmArm32 = (bytes: Uint8Array): string => {
  const L: string[] = [];
  L.push('── ARM32 (A32) 反汇编 (小端序, 4字节定长) ──');
  L.push('');
  let off = 0;
  while (off + 4 <= bytes.length) {
    const inst = (bytes[off]) | (bytes[off + 1] << 8) | (bytes[off + 2] << 16) | (bytes[off + 3] << 24);
    const addr = off;
    const hexBytes = [0, 1, 2, 3].map((i) => bytes[off + i].toString(16).padStart(2, '0')).join(' ');
    const text = decodeArm32(inst, addr);
    L.push(`${addr.toString(16).padStart(8, '0')}  ${hexBytes}  ${text}`);
    off += 4;
  }
  return L.join('\n');
};

const decodeArm32 = (inst: number, addr: number): string => {
  const cond = bits(inst, 31, 28);
  const condS = COND_NAMES[cond] ? COND_NAMES[cond] : '';
  // BX
  if ((inst & 0x0ffffff0) === 0x012fff10) {
    const rm = bits(inst, 3, 0);
    return `bx${condS} ${REG_NAMES[rm]}`;
  }
  // SVC
  if ((inst & 0x0f000000) === 0x0f000000) {
    const imm = inst & 0xffffff;
    return `svc${condS} #0x${imm.toString(16)}`;
  }
  // Branch (B/BL)
  if ((inst & 0x0e000000) === 0x0a000000) {
    const link = bits(inst, 24, 24);
    const off24 = signExtend(inst & 0xffffff, 24);
    const target = addr + 8 + off24 * 4;
    return `${link ? 'bl' : 'b'}${condS} 0x${target.toString(16)}`;
  }
  // Load/Store
  if ((inst & 0x0c000000) === 0x04000000) {
    const load = bits(inst, 20, 20);
    const writeback = bits(inst, 21, 21);
    const byteOp = bits(inst, 22, 22);
    const rn = bits(inst, 19, 16);
    const rd = bits(inst, 15, 12);
    const immFlag = bits(inst, 25, 25);
    const upFlag = bits(inst, 23, 23);
    const preFlag = bits(inst, 24, 24);
    let offset: number;
    if (immFlag) {
      // shift register
      const rm = bits(inst, 3, 0);
      offset = 0;
      const op = `ldr${condS}${byteOp ? 'b' : ''} ${REG_NAMES[rd]}, [${REG_NAMES[rn]}, ${REG_NAMES[rm]}]`;
      return op;
    } else {
      offset = inst & 0xfff;
    }
    const offStr = offset === 0 ? '' : `, ${upFlag ? '' : '-'}#${offset}`;
    const wbStr = !preFlag ? ']' : (writeback ? ']!' : ']');
    const preStr = preFlag ? '' : ']';
    if (preFlag) {
      return `${load ? 'ldr' : 'str'}${condS}${byteOp ? 'b' : ''} ${REG_NAMES[rd]}, [${REG_NAMES[rn]}${offStr}]${writeback ? '!' : ''}`;
    } else {
      return `${load ? 'ldr' : 'str'}${condS}${byteOp ? 'b' : ''} ${REG_NAMES[rd]}, [${REG_NAMES[rn]}], ${upFlag ? '' : '-'}#${offset}`;
    }
  }
  // Data processing
  if ((inst & 0x0c000000) === 0x00000000 && (inst & 0x0f000000) !== 0) {
    const opcode = bits(inst, 24, 21);
    const sFlag = bits(inst, 20, 20);
    const rn = bits(inst, 19, 16);
    const rd = bits(inst, 15, 12);
    const immFlag = bits(inst, 25, 25);
    const opNames = ['and', 'eor', 'sub', 'rsb', 'add', 'adc', 'sbc', 'rsc', 'tst', 'teq', 'cmp', 'cmn', 'orr', 'mov', 'bic', 'mvn'];
    const name = opNames[opcode];
    let operand: string;
    if (immFlag) {
      const imm8 = inst & 0xff;
      const rot = bits(inst, 11, 8) * 2;
      const val = (imm8 >>> rot) | (imm8 << (32 - rot));
      operand = `#${val}`;
    } else {
      const rm = bits(inst, 3, 0);
      operand = REG_NAMES[rm];
    }
    const s = sFlag && !['tst', 'teq', 'cmp', 'cmn'].includes(name) ? 's' : '';
    if (['mov', 'mvn'].includes(name)) {
      return `${name}${condS}${s} ${REG_NAMES[rd]}, ${operand}`;
    }
    if (['tst', 'teq', 'cmp', 'cmn'].includes(name)) {
      return `${name}${condS} ${REG_NAMES[rn]}, ${operand}`;
    }
    return `${name}${condS}${s} ${REG_NAMES[rd]}, ${REG_NAMES[rn]}, ${operand}`;
  }
  // NOP (mov r0, r0) = 0xe1a00000
  if (inst === 0xe1a00000) return 'nop';
  return `.word 0x${inst.toString(16).padStart(8, '0')}  ; 未识别指令`;
};

/* ---------- ARM64 (A64) decoding ---------- */

const disasmArm64 = (bytes: Uint8Array): string => {
  const L: string[] = [];
  L.push('── ARM64 (A64) 反汇编 (小端序, 4字节定长) ──');
  L.push('');
  let off = 0;
  while (off + 4 <= bytes.length) {
    const inst = (bytes[off]) | (bytes[off + 1] << 8) | (bytes[off + 2] << 16) | (bytes[off + 3] << 24);
    const addr = off;
    const hexBytes = [0, 1, 2, 3].map((i) => bytes[off + i].toString(16).padStart(2, '0')).join(' ');
    const text = decodeArm64(inst, addr);
    L.push(`${addr.toString(16).padStart(8, '0')}  ${hexBytes}  ${text}`);
    off += 4;
  }
  return L.join('\n');
};

const decodeArm64 = (inst: number, addr: number): string => {
  // B / BL
  if ((inst & 0x7c000000) === 0x14000000) {
    const link = bits(inst, 31, 31);
    const off26 = signExtend(inst & 0x3ffffff, 26);
    const target = addr + off26 * 4;
    return `${link ? 'bl' : 'b'} 0x${target.toString(16)}`;
  }
  // RET
  if ((inst & 0xfffffc1f) === 0xd65f0000) {
    const rn = bits(inst, 9, 5);
    return `ret ${REG_NAMES_64[rn] === 'lr' ? '' : REG_NAMES_64[rn]}`.trim();
  }
  // SVC
  if ((inst & 0xffe0001f) === 0xd4000001) {
    const imm16 = bits(inst, 20, 5);
    return `svc #0x${imm16.toString(16)}`;
  }
  // NOP
  if (inst === 0xd503201f) return 'nop';
  // ADD/SUB immediate
  if ((inst & 0x1f000000) === 0x11000000) {
    const sf = bits(inst, 31, 31);
    const op = bits(inst, 30, 30);
    const s = bits(inst, 29, 29);
    const sh = bits(inst, 22, 22);
    const imm12 = bits(inst, 21, 10);
    const rn = bits(inst, 9, 5);
    const rd = bits(inst, 4, 0);
    const regs = sf ? REG_NAMES_64 : REG_NAMES;
    const name = op ? 'sub' : 'add';
    const imm = sh ? (imm12 << 12) : imm12;
    return `${name}${s ? 's' : ''} ${regs[rd]}, ${regs[rn]}, #${imm}`;
  }
  // MOVZ
  if ((inst & 0x1f800000) === 0x12800000) {
    const sf = bits(inst, 31, 31);
    const opc = bits(inst, 30, 29);
    const hw = bits(inst, 22, 21);
    const imm16 = bits(inst, 20, 5);
    const rd = bits(inst, 4, 0);
    const regs = sf ? REG_NAMES_64 : REG_NAMES;
    const names = ['movn', 'movz', '', 'movk'];
    const name = names[opc];
    if (name) {
      const shift = hw * 16;
      return `${name} ${regs[rd]}, #0x${imm16.toString(16)}${shift ? ', lsl #' + shift : ''}`;
    }
  }
  // LDR/STR (unsigned offset)
  if ((inst & 0x3b000000) === 0x39000000) {
    const size = bits(inst, 31, 30);
    const load = bits(inst, 22, 22);
    const imm12 = bits(inst, 21, 10);
    const rn = bits(inst, 9, 5);
    const rt = bits(inst, 4, 0);
    const offset = imm12 << size;
    const name = load ? 'ldr' : 'str';
    const reg = size === 3 ? REG_NAMES_64[rt] : REG_NAMES[rt];
    return `${name} ${reg}, [${REG_NAMES_64[rn]}, #${offset}]`;
  }
  return `.word 0x${(inst >>> 0).toString(16).padStart(8, '0')}  ; 未识别指令`;
};

/* ---------- Thumb decoding ---------- */

const disasmThumb = (bytes: Uint8Array): string => {
  const L: string[] = [];
  L.push('── Thumb 反汇编 (小端序, 2/4字节变长) ──');
  L.push('');
  let off = 0;
  while (off + 2 <= bytes.length) {
    const hw = bytes[off] | (bytes[off + 1] << 8);
    const addr = off;
    // Check 32-bit instructions
    const is32 = (hw & 0xe000) === 0xe000 && (hw & 0x1800) !== 0;
    if (is32 && off + 4 <= bytes.length) {
      const hw2 = bytes[off + 2] | (bytes[off + 3] << 8);
      const inst = (hw << 16) | hw2;
      const hexBytes = [0, 1, 2, 3].map((i) => bytes[off + i].toString(16).padStart(2, '0')).join(' ');
      const text = decodeThumb32(inst, addr);
      L.push(`${addr.toString(16).padStart(8, '0')}  ${hexBytes}  ${text}`);
      off += 4;
    } else {
      const hexBytes = [0, 1].map((i) => bytes[off + i].toString(16).padStart(2, '0')).join(' ');
      const text = decodeThumb16(hw, addr);
      L.push(`${addr.toString(16).padStart(8, '0')}  ${hexBytes}  ${text}`);
      off += 2;
    }
  }
  return L.join('\n');
};

const decodeThumb16 = (hw: number, addr: number): string => {
  // NOP
  if (hw === 0xbf00) return 'nop';
  // SVC
  if ((hw & 0xff00) === 0xdf00) {
    return `svc #${hw & 0xff}`;
  }
  // BX
  if ((hw & 0xff87) === 0x4700) {
    const rm = bits(hw, 6, 3);
    return `bx ${REG_NAMES[rm]}`;
  }
  // BLX
  if ((hw & 0xff87) === 0x4780) {
    const rm = bits(hw, 6, 3);
    return `blx ${REG_NAMES[rm]}`;
  }
  // PUSH
  if ((hw & 0xfe00) === 0xb400) {
    const m = bits(hw, 8, 8);
    const regs: string[] = [];
    for (let i = 0; i < 8; i++) if (bits(hw, i, i)) regs.push(REG_NAMES[i]);
    if (m) regs.push('lr');
    return `push {${regs.join(', ')}}`;
  }
  // POP
  if ((hw & 0xfe00) === 0xbc00) {
    const m = bits(hw, 8, 8);
    const regs: string[] = [];
    for (let i = 0; i < 8; i++) if (bits(hw, i, i)) regs.push(REG_NAMES[i]);
    if (m) regs.push('pc');
    return `pop {${regs.join(', ')}}`;
  }
  // MOV Rd, #imm8
  if ((hw & 0xf800) === 0x2000) {
    const rd = bits(hw, 10, 8);
    const imm = hw & 0xff;
    return `movs ${REG_NAMES[rd]}, #${imm}`;
  }
  // MOV Rd, Rm (high)
  if ((hw & 0xff00) === 0x4600) {
    const d = bits(hw, 7, 7);
    const rm = bits(hw, 6, 3);
    const rd = bits(hw, 2, 0) | (d << 3);
    return `mov ${REG_NAMES[rd]}, ${REG_NAMES[rm]}`;
  }
  // ADD Rd, Rn, #imm3
  if ((hw & 0xfe00) === 0x1c00) {
    const imm3 = bits(hw, 8, 6);
    const rn = bits(hw, 5, 3);
    const rd = bits(hw, 2, 0);
    return `adds ${REG_NAMES[rd]}, ${REG_NAMES[rn]}, #${imm3}`;
  }
  // SUB Rd, Rn, #imm3
  if ((hw & 0xfe00) === 0x1e00) {
    const imm3 = bits(hw, 8, 6);
    const rn = bits(hw, 5, 3);
    const rd = bits(hw, 2, 0);
    return `subs ${REG_NAMES[rd]}, ${REG_NAMES[rn]}, #${imm3}`;
  }
  // CMP Rn, #imm8
  if ((hw & 0xf800) === 0x2800) {
    const rn = bits(hw, 10, 8);
    const imm = hw & 0xff;
    return `cmp ${REG_NAMES[rn]}, #${imm}`;
  }
  // B (conditional)
  if ((hw & 0xf000) === 0xd000 && (hw & 0x0f00) !== 0x0e00) {
    const cond = bits(hw, 11, 8);
    const off8 = signExtend(hw & 0xff, 8);
    const target = addr + 4 + off8 * 2;
    return `b${COND_NAMES[cond]} 0x${target.toString(16)}`;
  }
  // B (unconditional)
  if ((hw & 0xf800) === 0xe000) {
    const off11 = signExtend(hw & 0x7ff, 11);
    const target = addr + 4 + off11 * 2;
    return `b 0x${target.toString(16)}`;
  }
  return `.hword 0x${hw.toString(16).padStart(4, '0')}  ; 未识别指令`;
};

const decodeThumb32 = (inst: number, addr: number): string => {
  const hw = (inst >>> 16) & 0xffff;
  // BL
  if ((hw & 0xf800) === 0xf000) {
    const s = bits(hw, 10, 10);
    const imm10 = hw & 0x3ff;
    const hw2 = inst & 0xffff;
    const j1 = bits(hw2, 13, 13);
    const j2 = bits(hw2, 11, 11);
    const imm11 = hw2 & 0x7ff;
    const i1 = !(j1 ^ s) ? 1 : 0;
    const i2 = !(j2 ^ s) ? 1 : 0;
    let off = (i1 << 24) | (i2 << 23) | (imm10 << 12) | (imm11 << 1);
    off = signExtend(off | (s ? 0xfe000000 : 0), 25);
    const target = addr + 4 + off;
    return `bl 0x${target.toString(16)}`;
  }
  return `.word 0x${inst.toString(16).padStart(8, '0')}  ; 未识别32位指令`;
};

/* ---------- Main ---------- */

const disasm = (input: string, arch: string): string => {
  const bytes = parseHex(input);
  if (bytes.length === 0) throw new Error('无有效十六进制数据');
  if (arch === 'ARM32') return disasmArm32(bytes);
  if (arch === 'ARM64') return disasmArm64(bytes);
  if (arch === 'Thumb') return disasmThumb(bytes);
  throw new Error(`未知架构: ${arch}`);
};

/* ---------- Component ---------- */

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    toolName="ARM反汇编"
    paramsConfig={[
      {
        name: 'arch',
        label: '架构',
        type: 'select',
        options: [
          { value: 'ARM32', label: 'ARM32 (A32)' },
          { value: 'ARM64', label: 'ARM64 (A64)' },
          { value: 'Thumb', label: 'Thumb' },
        ],
        default: 'ARM64',
      },
    ]}
    execute={(input: string, _mode: string, params: Record<string, unknown>): string => {
      const arch = (params.arch as string) || 'ARM64';
      return disasm(input, arch);
    }}
  />
);
export default ToolComponent;
