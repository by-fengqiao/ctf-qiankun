import AsyncTool from '../../_shared/AsyncTool';
import { readFileAsHex } from '../../_shared/inputUtils';
import { parseHex } from '../../_shared/hexUtils';
import type { ToolProps } from '../../types';

/* ---------- ELF parsing helpers ---------- */

const ELF_MAGIC = [0x7f, 0x45, 0x4c, 0x46]; // \x7fELF

const ELF_CLASS: Record<number, string> = { 1: 'ELF32', 2: 'ELF64' };
const ELF_DATA: Record<number, string> = { 1: '小端 (LSB)', 2: '大端 (MSB)' };
const ELF_TYPE: Record<number, string> = {
  0: 'ET_NONE (无类型)',
  1: 'ET_REL (可重定位)',
  2: 'ET_EXEC (可执行)',
  3: 'ET_DYN (共享库/PIE)',
  4: 'ET_CORE (核心转储)',
};
const ELF_MACHINE: Record<number, string> = {
  0x00: '无架构',
  0x03: 'x86 (Intel 80386)',
  0x3E: 'x86-64 (AMD64)',
  0x28: 'ARM',
  0xB7: 'AArch64 (ARM64)',
  0xF3: 'RISC-V',
  0x32: 'IA-64',
  0x08: 'MIPS',
};

const PH_TYPE: Record<number, string> = {
  0: 'PT_NULL',
  1: 'PT_LOAD',
  2: 'PT_DYNAMIC',
  3: 'PT_INTERP',
  4: 'PT_NOTE',
  5: 'PT_SHLIB',
  6: 'PT_PHDR',
  7: 'PT_TLS',
  0x6474e550: 'PT_GNU_EH_FRAME',
  0x6474e551: 'PT_GNU_STACK',
  0x6474e552: 'PT_GNU_RELRO',
  0x6474e553: 'PT_GNU_PROPERTY',
};

const SH_TYPE: Record<number, string> = {
  0: 'SHT_NULL',
  1: 'SHT_PROGBITS',
  2: 'SHT_SYMTAB',
  3: 'SHT_STRTAB',
  4: 'SHT_RELA',
  5: 'SHT_HASH',
  6: 'SHT_DYNAMIC',
  7: 'SHT_NOTE',
  8: 'SHT_NOBITS',
  9: 'SHT_REL',
  10: 'SHT_SHLIB',
  11: 'SHT_DYNSYM',
  14: 'SHT_INIT_ARRAY',
  15: 'SHT_FINI_ARRAY',
  16: 'SHT_PREINIT_ARRAY',
  17: 'SHT_GROUP',
  18: 'SHT_SYMTAB_SHNDX',
};

const DT_TAGS: Record<number, string> = {
  0: 'DT_NULL',
  1: 'DT_NEEDED',
  2: 'DT_PLTRELSZ',
  3: 'DT_PLTGOT',
  4: 'DT_HASH',
  5: 'DT_STRTAB',
  6: 'DT_SYMTAB',
  7: 'DT_RELA',
  8: 'DT_RELASZ',
  9: 'DT_RELAENT',
  10: 'DT_STRSZ',
  11: 'DT_SYMENT',
  12: 'DT_INIT',
  13: 'DT_FINI',
  14: 'DT_SONAME',
  15: 'DT_RPATH',
  16: 'DT_SYMBOLIC',
  17: 'DT_REL',
  18: 'DT_RELSZ',
  19: 'DT_RELENT',
  20: 'DT_PLTREL',
  21: 'DT_DEBUG',
  22: 'DT_TEXTREL',
  23: 'DT_JMPREL',
  24: 'DT_BIND_NOW',
  25: 'DT_INIT_ARRAY',
  26: 'DT_FINI_ARRAY',
  27: 'DT_INIT_ARRAYSZ',
  28: 'DT_FINI_ARRAYSZ',
  29: 'DT_RUNPATH',
  30: 'DT_FLAGS',
};

const PH_FLAGS: Record<number, string> = {
  0x4: 'R',
  0x5: 'R+X',
  0x6: 'R+W',
  0x7: 'R+W+X',
};

const PHENT_SIZE = { 1: 0x20, 2: 0x38 }; // program header entry size: ELF32=32, ELF64=56
const SHENT_SIZE = { 1: 0x28, 2: 0x40 }; // section header entry size: ELF32=40, ELF64=64

interface ElfParsed {
  bytes: Uint8Array;
  is64: boolean;
  little: boolean;
  ehdr: {
    e_type: number;
    e_machine: number;
    e_entry: bigint;
    e_phoff: bigint;
    e_shoff: bigint;
    e_phentsize: number;
    e_phnum: number;
    e_shentsize: number;
    e_shnum: number;
    e_shstrndx: number;
  };
}

const readU8 = (bytes: Uint8Array, off: number): number => bytes[off];

const readU16 = (bytes: Uint8Array, off: number, le: boolean): number => {
  return le
    ? bytes[off] | (bytes[off + 1] << 8)
    : (bytes[off] << 8) | bytes[off + 1];
};

const readU32 = (bytes: Uint8Array, off: number, le: boolean): number => {
  const a = le ? bytes[off] : bytes[off + 3];
  const b = le ? bytes[off + 1] : bytes[off + 2];
  const c = le ? bytes[off + 2] : bytes[off + 1];
  const d = le ? bytes[off + 3] : bytes[off];
  return (a | (b << 8) | (c << 16) | (d << 24)) >>> 0;
};

const readU64 = (bytes: Uint8Array, off: number, le: boolean): bigint => {
  const parts: number[] = [];
  for (let i = 0; i < 8; i++) parts.push(bytes[off + (le ? i : 7 - i)]);
  let val = 0n;
  for (let i = 7; i >= 0; i--) val = (val << 8n) | BigInt(parts[i]);
  return val;
};

const readAddr = (bytes: Uint8Array, off: number, is64: boolean, le: boolean): bigint => {
  return is64 ? readU64(bytes, off, le) : BigInt(readU32(bytes, off, le));
};

const hexStr = (val: bigint): string => '0x' + val.toString(16);

const parseElfHeader = (bytes: Uint8Array): ElfParsed => {
  for (let i = 0; i < 4; i++) {
    if (bytes[i] !== ELF_MAGIC[i]) {
      throw new Error(`不是有效的 ELF 文件（魔数不匹配，期望 7f 45 4c 46）`);
    }
  }
  const ei_class = readU8(bytes, 4);
  const ei_data = readU8(bytes, 5);
  if (ei_class !== 1 && ei_class !== 2) throw new Error(`无效的 ELF class: ${ei_class}`);
  if (ei_data !== 1 && ei_data !== 2) throw new Error(`无效的 ELF data encoding: ${ei_data}`);
  const is64 = ei_class === 2;
  const le = ei_data === 1;

  const ehdr = {
    e_type: readU16(bytes, 16, le),
    e_machine: readU16(bytes, 18, le),
    e_entry: readAddr(bytes, is64 ? 24 : 24, is64, le),
    e_phoff: is64
      ? readU64(bytes, 32, le)
      : BigInt(readU32(bytes, 28, le)),
    e_shoff: is64
      ? readU64(bytes, 40, le)
      : BigInt(readU32(bytes, 32, le)),
    e_phentsize: readU16(bytes, is64 ? 54 : 42, le),
    e_phnum: readU16(bytes, is64 ? 56 : 44, le),
    e_shentsize: readU16(bytes, is64 ? 58 : 46, le),
    e_shnum: readU16(bytes, is64 ? 60 : 48, le),
    e_shstrndx: readU16(bytes, is64 ? 62 : 50, le),
  };
  return { bytes, is64, little: le, ehdr };
};

interface PhdrEntry {
  p_type: number;
  p_offset: bigint;
  p_vaddr: bigint;
  p_filesz: bigint;
  p_memsz: bigint;
  p_flags: number;
  p_align: bigint;
}

const parseProgramHeaders = (elf: ElfParsed): PhdrEntry[] => {
  const { bytes, is64, little, ehdr } = elf;
  const entries: PhdrEntry[] = [];
  const base = Number(ehdr.e_phoff);
  const step = ehdr.e_phentsize || PHENT_SIZE[is64 ? 2 : 1];
  for (let i = 0; i < ehdr.e_phnum; i++) {
    const o = base + i * step;
    if (o + step > bytes.length) break;
    if (is64) {
      entries.push({
        p_type: readU32(bytes, o, little),
        p_flags: readU32(bytes, o + 4, little),
        p_offset: readU64(bytes, o + 8, little),
        p_vaddr: readU64(bytes, o + 16, little),
        p_filesz: readU64(bytes, o + 32, little),
        p_memsz: readU64(bytes, o + 40, little),
        p_align: readU64(bytes, o + 48, little),
      });
    } else {
      entries.push({
        p_type: readU32(bytes, o, little),
        p_offset: BigInt(readU32(bytes, o + 4, little)),
        p_vaddr: BigInt(readU32(bytes, o + 8, little)),
        p_filesz: BigInt(readU32(bytes, o + 16, little)),
        p_memsz: BigInt(readU32(bytes, o + 20, little)),
        p_flags: readU32(bytes, o + 24, little),
        p_align: BigInt(readU32(bytes, o + 28, little)),
      });
    }
  }
  return entries;
};

interface ShdrEntry {
  sh_name: number;
  sh_type: number;
  sh_addr: bigint;
  sh_offset: bigint;
  sh_size: bigint;
  sh_link: number;
  sh_entsize: bigint;
}

const parseSectionHeaders = (elf: ElfParsed): ShdrEntry[] => {
  const { bytes, is64, little, ehdr } = elf;
  const entries: ShdrEntry[] = [];
  const base = Number(ehdr.e_shoff);
  const step = ehdr.e_shentsize || SHENT_SIZE[is64 ? 2 : 1];
  for (let i = 0; i < ehdr.e_shnum; i++) {
    const o = base + i * step;
    if (o + step > bytes.length) break;
    if (is64) {
      entries.push({
        sh_name: readU32(bytes, o, little),
        sh_type: readU32(bytes, o + 4, little),
        sh_addr: readU64(bytes, o + 16, little),
        sh_offset: readU64(bytes, o + 24, little),
        sh_size: readU64(bytes, o + 32, little),
        sh_link: readU32(bytes, o + 40, little),
        sh_entsize: readU64(bytes, o + 56, little),
      });
    } else {
      entries.push({
        sh_name: readU32(bytes, o, little),
        sh_type: readU32(bytes, o + 4, little),
        sh_addr: BigInt(readU32(bytes, o + 12, little)),
        sh_offset: BigInt(readU32(bytes, o + 16, little)),
        sh_size: BigInt(readU32(bytes, o + 20, little)),
        sh_link: readU32(bytes, o + 24, little),
        sh_entsize: BigInt(readU32(bytes, o + 36, little)),
      });
    }
  }
  return entries;
};

/** Read a NUL-terminated string from bytes at offset. */
const readCStr = (bytes: Uint8Array, off: number, max = 256): string => {
  const chars: string[] = [];
  for (let i = 0; i < max && off + i < bytes.length; i++) {
    const b = bytes[off + i];
    if (b === 0) break;
    chars.push(b >= 0x20 && b < 0x7f ? String.fromCharCode(b) : '.');
  }
  return chars.join('');
};

interface DynEntry {
  d_tag: bigint;
  d_val: bigint;
}

const parseDynamic = (elf: ElfParsed, phdrs: PhdrEntry[]): { entries: DynEntry[]; strtabOff: bigint } => {
  const dynPhdr = phdrs.find((p) => p.p_type === 2);
  if (!dynPhdr) return { entries: [], strtabOff: 0n };
  const { bytes, is64, little } = elf;
  const base = Number(dynPhdr.p_offset);
  const entrySize = is64 ? 16 : 8;
  const entries: DynEntry[] = [];
  for (let off = base; off + entrySize <= bytes.length; off += entrySize) {
    const tag = is64
      ? readU64(bytes, off, little)
      : BigInt(readU32(bytes, off, little));
    const val = is64
      ? readU64(bytes, off + 8, little)
      : BigInt(readU32(bytes, off + 4, little));
    entries.push({ d_tag: tag, d_val: val });
    if (tag === 0n) break;
  }
  let strtabOff = 0n;
  const strtabEntry = entries.find((e) => e.d_tag === 5n); // DT_STRTAB
  if (strtabEntry) strtabOff = strtabEntry.d_val;
  return { entries, strtabOff };
};

/* ---------- Main parse logic ---------- */

const parseElf = (bytes: Uint8Array): string => {
  if (bytes.length < 64) throw new Error('数据过短，无法解析 ELF 头');
  const elf = parseElfHeader(bytes);
  const { is64, little, ehdr } = elf;
  const L: string[] = [];

  L.push('═══════════════════════════════════════════');
  L.push('  ELF 文件解析报告');
  L.push('═══════════════════════════════════════════');
  L.push('');
  L.push('── ELF 头 (ELF Header) ──');
  L.push(`  魔数:      7f 45 4c 46 (${bytes[4] === 2 ? 'ELF' : 'elf'}) ✓`);
  L.push(`  类:        ${ELF_CLASS[bytes[4]] ?? '未知'} (EI_CLASS=${bytes[4]})`);
  L.push(`  字节序:    ${ELF_DATA[bytes[5]] ?? '未知'} (EI_DATA=${bytes[5]})`);
  L.push(`  版本:      ${bytes[6]} (EI_VERSION)`);
  L.push(`  ABI:       ${bytes[7]} (EI_OSABI)`);
  L.push(`  类型:      ${ELF_TYPE[ehdr.e_type] ?? `0x${ehdr.e_type.toString(16)}`} (e_type=${ehdr.e_type})`);
  L.push(`  机器:      ${ELF_MACHINE[ehdr.e_machine] ?? `0x${ehdr.e_machine.toString(16)}`} (e_machine=0x${ehdr.e_machine.toString(16)})`);
  L.push(`  入口点:    ${hexStr(ehdr.e_entry)}`);
  L.push(`  PH偏移:    ${hexStr(ehdr.e_phoff)} (${ehdr.e_phnum} 个, 每项 ${ehdr.e_phentsize} 字节)`);
  L.push(`  SH偏移:    ${hexStr(ehdr.e_shoff)} (${ehdr.e_shnum} 个, 每项 ${ehdr.e_shentsize} 字节)`);
  L.push(`  SH索引:    ${ehdr.e_shstrndx} (节区名字符串表索引)`);
  L.push('');

  // Program headers
  const phdrs = parseProgramHeaders(elf);
  if (phdrs.length > 0) {
    L.push('── 程序头表 (Program Headers) ──');
    phdrs.forEach((p, i) => {
      const typeName = PH_TYPE[p.p_type] ?? `0x${p.p_type.toString(16)}`;
      L.push(`  [${i}] ${typeName}`);
      L.push(`       offset: ${hexStr(p.p_offset)}  vaddr: ${hexStr(p.p_vaddr)}`);
      L.push(`       filesz: ${hexStr(p.p_filesz)}  memsz: ${hexStr(p.p_memsz)}`);
      L.push(`       flags:  ${PH_FLAGS[p.p_flags] ?? `0x${p.p_flags.toString(16)}`}  align: ${hexStr(p.p_align)}`);
    });
    L.push('');
  }

  // Section headers
  const shdrs = parseSectionHeaders(elf);
  let shstrOff = 0n;
  if (ehdr.e_shstrndx < shdrs.length) {
    shstrOff = shdrs[ehdr.e_shstrndx].sh_offset;
  }
  if (shdrs.length > 0) {
    L.push('── 节区头表 (Section Headers) ──');
    shdrs.forEach((s, i) => {
      const nameOff = Number(shstrOff) + s.sh_name;
      const name = nameOff < bytes.length ? readCStr(bytes, nameOff) : '';
      const typeName = SH_TYPE[s.sh_type] ?? `0x${s.sh_type.toString(16)}`;
      L.push(`  [${i}] ${name || '(unnamed)'}`);
      L.push(`       type: ${typeName}  addr: ${hexStr(s.sh_addr)}`);
      L.push(`       offset: ${hexStr(s.sh_offset)}  size: ${hexStr(s.sh_size)}`);
      L.push(`       link: ${s.sh_link}  entsize: ${hexStr(s.sh_entsize)}`);
    });
    L.push('');
  }

  // Dynamic segment
  const { entries: dynEntries, strtabOff } = parseDynamic(elf, phdrs);
  if (dynEntries.length > 0) {
    L.push('── 动态段 (Dynamic Segment) ──');
    dynEntries.forEach((e) => {
      const tagName = DT_TAGS[Number(e.d_tag)] ?? `0x${e.d_tag.toString(16)}`;
      let valStr: string;
      if (e.d_tag === 1n || e.d_tag === 14n || e.d_tag === 15n) {
        // DT_NEEDED / DT_SONAME / DT_RPATH: offset into string table
        const sOff = Number(strtabOff) + Number(e.d_val);
        valStr = `"${readCStr(bytes, sOff)}"`;
      } else {
        valStr = hexStr(e.d_val);
      }
      L.push(`  ${tagName}: ${valStr}`);
    });
    L.push('');
  }

  L.push('── 摘要 ──');
  L.push(`  程序头: ${phdrs.length} 个`);
  L.push(`  节区头: ${shdrs.length} 个`);
  L.push(`  动态条目: ${dynEntries.length} 个`);
  L.push(`  文件大小: ${bytes.length} 字节`);
  return L.join('\n');
};

/* ---------- Component ---------- */

const ToolComponent = (props: ToolProps) => (
  <AsyncTool
    {...props}
    toolName="ELF文件解析"
    execute={async (input: string, _mode: string, _params: Record<string, unknown>, file: File | null) => {
      let hexData = input;
      if (file) {
        hexData = await readFileAsHex(file, 1024 * 1024);
      }
      const bytes = parseHex(hexData.replace(/.*\n\n.*$/s, '').replace(/\s/g, ''));
      return parseElf(bytes);
    }}
  />
);
export default ToolComponent;
