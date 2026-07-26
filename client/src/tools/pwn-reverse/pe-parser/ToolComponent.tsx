import AsyncTool from '../../_shared/AsyncTool';
import { readFileAsHex } from '../../_shared/inputUtils';
import { parseHex } from '../../_shared/hexUtils';
import type { ToolProps } from '../../types';

/* ---------- PE parsing helpers ---------- */

const PE_MACHINE: Record<number, string> = {
  0x014c: 'x86 (Intel i386)',
  0x8664: 'x86-64 (AMD64)',
  0x01c0: 'ARM (Little Endian)',
  0xAA64: 'ARM64',
  0x0200: 'Intel Itanium',
  0x01f0: 'PowerPC',
};

const PE_CHARACTERISTICS: Record<number, string> = {
  0x0001: 'RELOCS_STRIPPED',
  0x0002: 'EXECUTABLE_IMAGE',
  0x0004: 'LINE_NUMS_STRIPPED',
  0x0008: 'LOCAL_SYMS_STRIPPED',
  0x0100: '32BIT_MACHINE',
  0x0200: 'DEBUG_STRIPPED',
  0x0400: 'REMOVABLE_RUN_FROM_SWAP',
  0x2000: 'DLL',
  0x4000: 'UP_SYSTEM_ONLY',
};

const PE_SECTION_CHARS: Record<number, string> = {
  0x00000020: 'CODE',
  0x00000040: 'INITIALIZED_DATA',
  0x00000080: 'UNINITIALIZED_DATA',
  0x02000000: 'MEM_DISCARDABLE',
  0x10000000: 'MEM_SHARED',
  0x20000000: 'MEM_EXECUTE',
  0x40000000: 'MEM_READ',
  0x80000000: 'MEM_WRITE',
};

const PE_SUBSYSTEM: Record<number, string> = {
  1: 'NATIVE',
  2: 'WINDOWS_GUI',
  3: 'WINDOWS_CONSOLE',
  5: 'OS2_CONSOLE',
  7: 'POSIX',
  9: 'WINDOWS_CE_GUI',
  10: 'EFI_APPLICATION',
  11: 'EFI_BOOT_SERVICE_DRIVER',
  12: 'EFI_RUNTIME_DRIVER',
  13: 'EFI_ROM',
};

const readU16LE = (bytes: Uint8Array, off: number): number =>
  bytes[off] | (bytes[off + 1] << 8);

const readU32LE = (bytes: Uint8Array, off: number): number =>
  (bytes[off] | (bytes[off + 1] << 8) | (bytes[off + 2] << 16) | (bytes[off + 3] << 24)) >>> 0;

const readU32LEBig = (bytes: Uint8Array, off: number): bigint => {
  let val = 0n;
  for (let i = 3; i >= 0; i--) val = (val << 8n) | BigInt(bytes[off + i]);
  return val;
};

const readU64LE = (bytes: Uint8Array, off: number): bigint => {
  let val = 0n;
  for (let i = 7; i >= 0; i--) val = (val << 8n) | BigInt(bytes[off + i]);
  return val;
};

const hexStr = (val: bigint | number): string =>
  '0x' + (typeof val === 'bigint' ? val.toString(16) : val.toString(16));

const readCStr = (bytes: Uint8Array, off: number, max = 256): string => {
  const chars: string[] = [];
  for (let i = 0; i < max && off + i < bytes.length; i++) {
    const b = bytes[off + i];
    if (b === 0) break;
    chars.push(b >= 0x20 && b < 0x7f ? String.fromCharCode(b) : '.');
  }
  return chars.join('');
};

const flagsToStr = (flags: number, table: Record<number, string>): string => {
  const parts: string[] = [];
  for (const bit of Object.keys(table)) {
    const bitNum = parseInt(bit, 10);
    if (flags & bitNum) parts.push(table[bitNum]);
  }
  return parts.length > 0 ? parts.join(' | ') : '(无)';
};

/* ---------- PE parsing ---------- */

interface PeSection {
  name: string;
  virtualSize: number;
  virtualAddress: number;
  sizeOfRawData: number;
  pointerToRawData: number;
  characteristics: number;
}

interface PeHeaders {
  e_lfanew: number;
  machine: number;
  numberOfSections: number;
  timeDateStamp: number;
  characteristics: number;
  is64: boolean;
  entryPoint: bigint;
  imageBase: bigint;
  sectionAlignment: number;
  fileAlignment: number;
  sizeOfImage: number;
  sizeOfHeaders: number;
  subsystem: number;
  dataDirectories: { rva: number; size: number }[];
  sections: PeSection[];
}

const parsePe = (bytes: Uint8Array): PeHeaders => {
  if (bytes[0] !== 0x4d || bytes[1] !== 0x5a) {
    throw new Error('不是有效的 PE 文件（MZ 魔数不匹配，期望 4d 5a）');
  }
  const e_lfanew = readU32LE(bytes, 0x3c);
  if (e_lfanew + 4 > bytes.length) throw new Error('e_lfanew 超出文件范围');
  // PE signature "PE\0\0"
  if (
    bytes[e_lfanew] !== 0x50 ||
    bytes[e_lfanew + 1] !== 0x45 ||
    bytes[e_lfanew + 2] !== 0x00 ||
    bytes[e_lfanew + 3] !== 0x00
  ) {
    throw new Error('PE 签名不匹配（期望 50 45 00 00）');
  }

  const coffOffset = e_lfanew + 4;
  const machine = readU16LE(bytes, coffOffset);
  const numberOfSections = readU16LE(bytes, coffOffset + 2);
  const timeDateStamp = readU32LE(bytes, coffOffset + 4);
  const characteristics = readU16LE(bytes, coffOffset + 18);
  const sizeOfOptionalHeader = readU16LE(bytes, coffOffset + 16);

  const optOffset = coffOffset + 20;
  const magic = readU16LE(bytes, optOffset);
  const is64 = magic === 0x20b;

  const entryPoint = readU32LEBig(bytes, optOffset + 16);
  const imageBase = is64
    ? readU64LE(bytes, optOffset + 24)
    : readU32LEBig(bytes, optOffset + 28);
  const sectionAlignment = readU32LE(bytes, optOffset + (is64 ? 32 : 36));
  const fileAlignment = readU32LE(bytes, optOffset + (is64 ? 36 : 40));
  const sizeOfImage = readU32LE(bytes, optOffset + (is64 ? 56 : 80));
  const sizeOfHeaders = readU32LE(bytes, optOffset + (is64 ? 60 : 84));
  const subsystem = readU16LE(bytes, optOffset + (is64 ? 68 : 92));

  // Data directories
  const ddOffset = optOffset + (is64 ? 112 : 96);
  const dataDirectories: { rva: number; size: number }[] = [];
  for (let i = 0; i < 16; i++) {
    const ddo = ddOffset + i * 8;
    if (ddo + 8 > bytes.length) break;
    dataDirectories.push({
      rva: readU32LE(bytes, ddo),
      size: readU32LE(bytes, ddo + 4),
    });
  }

  // Section table
  const secTableOffset = optOffset + sizeOfOptionalHeader;
  const sections: PeSection[] = [];
  for (let i = 0; i < numberOfSections; i++) {
    const so = secTableOffset + i * 40;
    if (so + 40 > bytes.length) break;
    sections.push({
      name: readCStr(bytes, so, 8),
      virtualSize: readU32LE(bytes, so + 8),
      virtualAddress: readU32LE(bytes, so + 12),
      sizeOfRawData: readU32LE(bytes, so + 16),
      pointerToRawData: readU32LE(bytes, so + 20),
      characteristics: readU32LE(bytes, so + 36),
    });
  }

  return {
    e_lfanew,
    machine,
    numberOfSections,
    timeDateStamp,
    characteristics,
    is64,
    entryPoint,
    imageBase,
    sectionAlignment,
    fileAlignment,
    sizeOfImage,
    sizeOfHeaders,
    subsystem,
    dataDirectories,
    sections,
  };
};

const DATA_DIR_NAMES = [
  'Export', 'Import', 'Resource', 'Exception',
  'Certificate', 'Base Relocation', 'Debug', 'Architecture',
  'Global Ptr', 'TLS', 'Load Config', 'Bound Import',
  'IAT', 'Delay Import', 'CLR Runtime', 'Reserved',
];

const rvaToOffset = (rva: number, sections: PeSection[]): number => {
  for (const s of sections) {
    if (rva >= s.virtualAddress && rva < s.virtualAddress + Math.max(s.virtualSize, s.sizeOfRawData)) {
      return rva - s.virtualAddress + s.pointerToRawData;
    }
  }
  return rva;
};

const parseImportTable = (bytes: Uint8Array, pe: PeHeaders): string[] => {
  const L: string[] = [];
  if (pe.dataDirectories.length < 2 || pe.dataDirectories[1].rva === 0) {
    return L;
  }
  const importDirRva = pe.dataDirectories[1].rva;
  let offset = rvaToOffset(importDirRva, pe.sections);
  L.push('  导入表 (Import Table):');
  let idx = 0;
  while (offset + 20 <= bytes.length && idx < 200) {
    const originalFirstThunk = readU32LE(bytes, offset);
    const nameRva = readU32LE(bytes, offset + 12);
    if (nameRva === 0 && originalFirstThunk === 0) break;
    const nameOff = rvaToOffset(nameRva, pe.sections);
    const dllName = readCStr(bytes, nameOff);
    L.push(`    DLL: ${dllName}`);

    // Read imported function names
    const thunkRva = originalFirstThunk || readU32LE(bytes, offset + 16);
    if (thunkRva !== 0) {
      let thunkOff = rvaToOffset(thunkRva, pe.sections);
      const thunkStep = pe.is64 ? 8 : 4;
      let funcCount = 0;
      while (thunkOff + thunkStep <= bytes.length && funcCount < 100) {
        const thunkVal = pe.is64
          ? Number(readU64LE(bytes, thunkOff) & 0x7fffffffffffffffn)
          : readU32LE(bytes, thunkOff);
        if (thunkVal === 0) break;
        const isOrdinal = pe.is64
          ? (readU64LE(bytes, thunkOff) & 0x8000000000000000n) !== 0n
          : (thunkVal & 0x80000000) !== 0;
        if (isOrdinal) {
          const ordinal = thunkVal & 0xffff;
          L.push(`      - Ordinal ${ordinal}`);
        } else {
          const funcNameOff = rvaToOffset(thunkVal + 2, pe.sections);
          const funcName = readCStr(bytes, funcNameOff);
          L.push(`      - ${funcName}`);
        }
        thunkOff += thunkStep;
        funcCount++;
      }
    }
    offset += 20;
    idx++;
  }
  return L;
};

const parseExportTable = (bytes: Uint8Array, pe: PeHeaders): string[] => {
  const L: string[] = [];
  if (pe.dataDirectories.length < 1 || pe.dataDirectories[0].rva === 0) {
    return L;
  }
  const exportRva = pe.dataDirectories[0].rva;
  const offset = rvaToOffset(exportRva, pe.sections);
  if (offset + 40 > bytes.length) return L;
  const nameRva = readU32LE(bytes, offset + 12);
  const numberOfFunctions = readU32LE(bytes, offset + 20);
  const numberOfNames = readU32LE(bytes, offset + 24);
  const nameRvasOff = rvaToOffset(readU32LE(bytes, offset + 32), pe.sections);

  const dllNameOff = rvaToOffset(nameRva, pe.sections);
  const dllName = readCStr(bytes, dllNameOff);
  L.push('  导出表 (Export Table):');
  L.push(`    DLL 名称: ${dllName}`);
  L.push(`    导出函数数: ${numberOfFunctions}`);
  L.push(`    命名函数数: ${numberOfNames}`);

  const maxNames = Math.min(numberOfNames, 50);
  for (let i = 0; i < maxNames; i++) {
    const nameOff = rvaToOffset(readU32LE(bytes, nameRvasOff + i * 4), pe.sections);
    const funcName = readCStr(bytes, nameOff);
    L.push(`    [${i}] ${funcName}`);
  }
  if (numberOfNames > maxNames) {
    L.push(`    ... (共 ${numberOfNames} 个，仅显示前 ${maxNames})`);
  }
  return L;
};

/* ---------- Main ---------- */

const analyzePe = (bytes: Uint8Array): string => {
  const pe = parsePe(bytes);
  const L: string[] = [];

  L.push('═══════════════════════════════════════════');
  L.push('  PE 文件解析报告');
  L.push('═══════════════════════════════════════════');
  L.push('');
  L.push('── DOS 头 (DOS Header) ──');
  L.push(`  魔数:       4d 5a (MZ) ✓`);
  L.push(`  e_lfanew:   ${hexStr(pe.e_lfanew)} (PE头偏移)`);
  L.push('');
  L.push('── PE / COFF 头 ──');
  L.push(`  机器:       ${PE_MACHINE[pe.machine] ?? '未知'} (0x${pe.machine.toString(16).padStart(4, '0')})`);
  L.push(`  节区数:     ${pe.numberOfSections}`);
  L.push(`  时间戳:     0x${pe.timeDateStamp.toString(16)} (${new Date(pe.timeDateStamp * 1000).toISOString()})`);
  L.push(`  特征:       0x${pe.characteristics.toString(16)} (${flagsToStr(pe.characteristics, PE_CHARACTERISTICS)})`);
  L.push(`  可选头大小: ${pe.is64 ? 'PE32+' : 'PE32'} (magic=0x${pe.is64 ? '20b' : '10b'})`);
  L.push('');
  L.push('── 可选头 (Optional Header) ──');
  L.push(`  入口点:        ${hexStr(pe.entryPoint)} (RVA)`);
  L.push(`  映像基址:      ${hexStr(pe.imageBase)}`);
  L.push(`  节区对齐:      ${hexStr(pe.sectionAlignment)}`);
  L.push(`  文件对齐:      ${hexStr(pe.fileAlignment)}`);
  L.push(`  映像大小:      ${hexStr(pe.sizeOfImage)}`);
  L.push(`  头部大小:      ${hexStr(pe.sizeOfHeaders)}`);
  L.push(`  子系统:        ${PE_SUBSYSTEM[pe.subsystem] ?? pe.subsystem}`);
  L.push('');

  L.push('── 节区表 (Section Table) ──');
  pe.sections.forEach((s, i) => {
    L.push(`  [${i}] ${s.name.padEnd(8)}`);
    L.push(`       VirtualSize: ${hexStr(s.virtualSize)}  RVA: ${hexStr(s.virtualAddress)}`);
    L.push(`       RawSize: ${hexStr(s.sizeOfRawData)}  RawOffset: ${hexStr(s.pointerToRawData)}`);
    L.push(`       Characteristics: 0x${s.characteristics.toString(16)} (${flagsToStr(s.characteristics, PE_SECTION_CHARS)})`);
  });
  L.push('');

  L.push('── 数据目录 (Data Directories) ──');
  pe.dataDirectories.forEach((d, i) => {
    if (d.rva !== 0 || d.size !== 0) {
      L.push(`  [${i}] ${DATA_DIR_NAMES[i] ?? `Dir${i}`}: RVA=${hexStr(d.rva)} Size=${hexStr(d.size)}`);
    }
  });
  L.push('');

  const imports = parseImportTable(bytes, pe);
  L.push(...imports);
  if (imports.length === 0) L.push('  (无导入表)');

  L.push('');
  const exports = parseExportTable(bytes, pe);
  L.push(...exports);
  if (exports.length === 0) L.push('  (无导出表)');

  L.push('');
  L.push('── 摘要 ──');
  L.push(`  节区数: ${pe.sections.length}`);
  L.push(`  架构: ${pe.is64 ? 'PE32+ (64位)' : 'PE32 (32位)'}`);
  L.push(`  文件大小: ${bytes.length} 字节`);

  return L.join('\n');
};

/* ---------- Component ---------- */

const ToolComponent = (props: ToolProps) => (
  <AsyncTool
    {...props}
    toolName="PE文件解析"
    execute={async (input: string, _mode: string, _params: Record<string, unknown>, file: File | null) => {
      let hexData = input;
      if (file) {
        hexData = await readFileAsHex(file, 1024 * 1024);
      }
      const bytes = parseHex(hexData.replace(/.*\n\n.*$/s, '').replace(/\s/g, ''));
      return analyzePe(bytes);
    }}
  />
);
export default ToolComponent;
