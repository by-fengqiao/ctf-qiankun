import AsyncTool from '../../_shared/AsyncTool';
import { readFileAsHex } from '../../_shared/inputUtils';
import { parseHex } from '../../_shared/hexUtils';
import type { ToolProps } from '../../types';

/* ---------- .NET PE + CLI parser ---------- */

const PE_MAGIC = 0x5a4d; // 'MZ'
const PE_SIG = 0x00004550; // 'PE\0\0'
const CLI_HEADER_MAGIC = 0x48;
const METADATA_SIG = 0x424a5342; // 'BSJB'

interface PEReader {
  bytes: Uint8Array;
  pos: number;
}

const u8 = (r: PEReader): number => r.bytes[r.pos++];
const u16 = (r: PEReader): number => r.bytes[r.pos] | (r.bytes[r.pos + 1] << 8);
const u16adv = (r: PEReader): number => { const v = u16(r); r.pos += 2; return v; };
const u32 = (r: PEReader): number => (r.bytes[r.pos] | (r.bytes[r.pos + 1] << 8) | (r.bytes[r.pos + 2] << 16) | (r.bytes[r.pos + 3] << 24)) >>> 0;
const u32adv = (r: PEReader): number => { const v = u32(r); r.pos += 4; return v; };
const readBytes = (r: PEReader, n: number): Uint8Array => { const out = r.bytes.slice(r.pos, r.pos + n); r.pos += n; return out; };

const readCStr = (bytes: Uint8Array, off: number, max = 256): string => {
  const chars: string[] = [];
  for (let i = 0; i < max && off + i < bytes.length; i++) {
    const b = bytes[off + i];
    if (b === 0) break;
    chars.push(b >= 0x20 && b < 0x7f ? String.fromCharCode(b) : '.');
  }
  return chars.join('');
};

const readUtf8Str = (bytes: Uint8Array, off: number, len: number): string => {
  return new TextDecoder('utf-8', { fatal: false }).decode(bytes.slice(off, off + len));
};

/* ---------- CIL opcodes ---------- */

const CIL_OPCODES: Record<number, string> = {
  0x00: 'nop', 0x01: 'break', 0x02: 'ldarg.0', 0x03: 'ldarg.1',
  0x04: 'ldarg.2', 0x05: 'ldarg.3', 0x06: 'ldloc.0', 0x07: 'ldloc.1',
  0x08: 'ldloc.2', 0x09: 'ldloc.3', 0x0a: 'stloc.0', 0x0b: 'stloc.1',
  0x0c: 'stloc.2', 0x0d: 'stloc.3', 0x0e: 'ldarg.s', 0x0f: 'ldloc.s',
  0x10: 'stloc.s', 0x11: 'ldnull', 0x12: 'ldc.i4.m1', 0x13: 'ldc.i4.0',
  0x14: 'ldc.i4.1', 0x15: 'ldc.i4.2', 0x16: 'ldc.i4.3', 0x17: 'ldc.i4.4',
  0x18: 'ldc.i4.5', 0x19: 'ldc.i4.6', 0x1a: 'ldc.i4.7', 0x1b: 'ldc.i4.8',
  0x1c: 'ldc.i4.s', 0x1d: 'ldc.i4', 0x1e: 'ldc.i8', 0x1f: 'ldc.r4',
  0x20: 'ldc.r8', 0x21: 'dup', 0x22: 'pop', 0x23: 'jmp',
  0x24: 'call', 0x25: 'calli', 0x26: 'ret', 0x27: 'br.s',
  0x28: 'brfalse.s', 0x29: 'brtrue.s', 0x2a: 'bge.s', 0x2b: 'bgt.s',
  0x2c: 'ble.s', 0x2d: 'blt.s', 0x2e: 'beq.s', 0x2f: 'bne.un.s',
  0x30: 'bge.un.s', 0x31: 'bgt.un.s', 0x32: 'ble.un.s', 0x33: 'blt.un.s',
  0x34: 'beq', 0x38: 'br', 0x39: 'brfalse', 0x3a: 'brtrue',
  0x58: 'add', 0x59: 'sub', 0x5a: 'mul', 0x5b: 'div',
  0x5f: 'and', 0x60: 'or', 0x61: 'xor', 0x62: 'shl',
  0x63: 'shr', 0x67: 'conv.i1', 0x68: 'conv.i2', 0x69: 'conv.i4',
  0x6a: 'conv.i8', 0x6b: 'conv.r4', 0x6c: 'conv.r8',
  0x6f: 'callvirt', 0x70: 'cpobj', 0x71: 'ldobj', 0x72: 'ldstr',
  0x73: 'newobj', 0x74: 'castclass', 0x75: 'isinst', 0x79: 'unbox',
  0x7b: 'ldfld', 0x7c: 'ldflda', 0x7d: 'stfld', 0x7e: 'ldsfld',
  0x7f: 'ldsflda', 0x80: 'stsfld', 0x81: 'stobj', 0x8c: 'box',
  0x8d: 'newarr', 0x8e: 'ldlen', 0xa0: 'stelem.ref', 0xa2: 'stelem',
  0xa5: 'unbox.any', 0xd0: 'ldtoken', 0xdc: 'endfinally',
  0xdd: 'leave', 0xde: 'leave.s',
};

const CIL_OPCODES_PREFIX: Record<number, string> = {
  0x06: 'ceq', 0x04: 'cgt', 0x02: 'clt', 0x1e: 'rethrow',
  0x0c: 'ldftn', 0x0d: 'ldvirtftn', 0x0f: 'ldarg', 0x10: 'ldloc',
  0x11: 'stloc', 0x12: 'localloc', 0x15: 'initobj', 0x19: 'constrained.',
};

/* ---------- PE parsing ---------- */

interface PEInfo {
  is64: boolean;
  numberOfSections: number;
  sectionHeaders: SectionHeader[];
  optHeaderSize: number;
}

interface SectionHeader {
  name: string;
  virtualSize: number;
  virtualAddress: number;
  sizeOfRawData: number;
  pointerToRawData: number;
}

interface CliHeader {
  metaRva: number;
  metaSize: number;
}

const rvaToOffset = (pe: PEInfo, rva: number): number => {
  for (const s of pe.sectionHeaders) {
    if (rva >= s.virtualAddress && rva < s.virtualAddress + Math.max(s.virtualSize, s.sizeOfRawData)) {
      return s.pointerToRawData + (rva - s.virtualAddress);
    }
  }
  return rva;
};

const parsePE = (bytes: Uint8Array): { pe: PEInfo; cli: CliHeader | null } => {
  const r: PEReader = { bytes, pos: 0 };
  if (u16(r) !== PE_MAGIC) throw new Error('不是有效 PE 文件 (缺少 MZ 标记)');
  r.pos = 0x3c;
  const peOff = u16adv(r);
  r.pos = peOff;
  if (u32adv(r) !== PE_SIG) throw new Error('不是有效 PE 文件 (缺少 PE 签名)');

  const machine = u16adv(r);
  const numberOfSections = u16adv(r);
  u32adv(r); // TimeDateStamp
  u32adv(r); // PointerToSymbolTable
  u32adv(r); // NumberOfSymbols
  const optHeaderSize = u16adv(r);
  const characteristics = u16adv(r);
  void characteristics;

  // COFF header parsed, now optional header
  const optStart = r.pos;
  const magic = u16adv(r); // 0x10b = PE32, 0x20b = PE32+
  const is64 = magic === 0x20b;

  // Skip to data directories. PE32: opt header before data directories = 96 bytes; PE32+: 112 bytes
  r.pos = optStart + (is64 ? 112 : 96);
  // Data directory #14 = COM Descriptor (CLI Header)
  // Each entry is 8 bytes (RVA + size)
  r.pos = optStart + (is64 ? 112 : 96) + 14 * 8;
  const cliRva = u32adv(r);
  const cliSize = u32adv(r);

  // Skip optional header to section headers
  r.pos = optStart + optHeaderSize;

  const sectionHeaders: SectionHeader[] = [];
  for (let i = 0; i < numberOfSections; i++) {
    const name = readCStr(bytes, r.pos, 8);
    r.pos += 8;
    const virtualSize = u32adv(r);
    const virtualAddress = u32adv(r);
    const sizeOfRawData = u32adv(r);
    const pointerToRawData = u32adv(r);
    r.pos += 16; // skip rest of section header (relocations, linenums, etc.)
    sectionHeaders.push({ name, virtualSize, virtualAddress, sizeOfRawData, pointerToRawData });
  }

  const pe: PEInfo = { is64, numberOfSections, sectionHeaders, optHeaderSize };
  let cli: CliHeader | null = null;
  if (cliRva !== 0) {
    const cliOff = rvaToOffset(pe, cliRva);
    const cr: PEReader = { bytes, pos: cliOff };
    u32adv(cr); // cb (size)
    u16adv(cr); // MajorRuntimeVersion
    u16adv(cr); // MinorRuntimeVersion
    const metaRva = u32adv(cr);
    const metaSize = u32adv(cr);
    cli = { metaRva, metaSize };
  }
  void machine;
  return { pe, cli };
};

/* ---------- Metadata parsing ---------- */

interface MetadataInfo {
  version: string;
  stringsHeap: Uint8Array;
  userStringsHeap: Uint8Array;
  guidHeap: Uint8Array;
  blobHeap: Uint8Array;
  tableStream: Uint8Array;
}

const parseMetadata = (bytes: Uint8Array, pe: PEInfo, metaRva: number): MetadataInfo => {
  const off = rvaToOffset(pe, metaRva);
  const r: PEReader = { bytes, pos: off };
  const sig = u32adv(r);
  if (sig !== METADATA_SIG) throw new Error(`元数据签名错误: 期望 BSJB (0x424a5342), 实际 0x${sig.toString(16)}`);

  const majorVer = u16adv(r);
  const minorVer = u16adv(r);
  void majorVer; void minorVer;
  const reserved = u32adv(r);
  void reserved;
  const versionLen = u32adv(r);
  const version = readUtf8Str(bytes, r.pos, versionLen).replace(/\0+$/, '');
  r.pos += versionLen;
  // Align to 4
  r.pos = (r.pos + 3) & ~3;
  const flags = u16adv(r);
  void flags;
  const streamsCount = u16adv(r);

  let stringsHeap = new Uint8Array(0);
  let userStringsHeap = new Uint8Array(0);
  let guidHeap = new Uint8Array(0);
  let blobHeap = new Uint8Array(0);
  let tableStreamOff = 0;
  let tableStreamSize = 0;

  for (let i = 0; i < streamsCount; i++) {
    const sOff = u32adv(r);
    const sSize = u32adv(r);
    const nameStart = r.pos;
    const name = readCStr(bytes, nameStart, 32);
    r.pos += name.length + 1;
    r.pos = (r.pos + 3) & ~3; // align
    const data = bytes.slice(off + sOff, off + sOff + sSize);
    if (name === '#Strings') stringsHeap = data;
    else if (name === '#US') userStringsHeap = data;
    else if (name === '#GUID') guidHeap = data;
    else if (name === '#Blob') blobHeap = data;
    else if (name === '#~' || name === '#-') {
      tableStreamOff = off + sOff;
      tableStreamSize = sSize;
    }
  }

  const tableStream = bytes.slice(tableStreamOff, tableStreamOff + tableStreamSize);
  return { version, stringsHeap, userStringsHeap, guidHeap, blobHeap, tableStream };
};

const readHeapString = (heap: Uint8Array, idx: number): string => {
  if (idx === 0 || idx >= heap.length) return '';
  let end = idx;
  while (end < heap.length && heap[end] !== 0) end++;
  return new TextDecoder('utf-8', { fatal: false }).decode(heap.slice(idx, end));
};

const readUserString = (heap: Uint8Array, idx: number): string => {
  if (idx === 0 || idx >= heap.length) return '';
  let r = idx;
  // compressed length
  const b0 = heap[r++];
  let len = 0;
  if ((b0 & 0x80) === 0) len = b0;
  else if ((b0 & 0xc0) === 0x80) len = ((b0 & 0x3f) << 8) | heap[r++];
  else len = ((b0 & 0x1f) << 24) | (heap[r++] << 16) | (heap[r++] << 8) | heap[r++];
  const strBytes = heap.slice(r, r + len - 1);
  return new TextDecoder('utf-16le', { fatal: false }).decode(strBytes);
};

/* ---------- Metadata table parsing ---------- */

// Table row sizes depend on heap index sizes (from #~ header)
interface TableHeader {
  heapIndexSizes: { strings: number; guid: number; blob: number };
  validTables: bigint;
  sortedTables: bigint;
  rowCounts: number[];
}

const TABLE_TYPEDEF = 0x02;
const TABLE_METHODDEF = 0x06;
const TABLE_TYPEREF = 0x01;
const TABLE_MEMBERREF = 0x0a;
const TABLE_MODULE = 0x00;

const TABLE_NAMES: Record<number, string> = {
  0x00: 'Module', 0x01: 'TypeRef', 0x02: 'TypeDef', 0x03: 'FieldPtr',
  0x04: 'Field', 0x05: 'MethodPtr', 0x06: 'MethodDef', 0x07: 'ParamPtr',
  0x08: 'Param', 0x09: 'InterfaceImpl', 0x0a: 'MemberRef',
  0x0b: 'Constant', 0x0c: 'CustomAttribute', 0x0d: 'FieldMarshal',
  0x0e: 'DeclSecurity', 0x0f: 'ClassLayout', 0x10: 'FieldLayout',
  0x11: 'StandAloneSig', 0x12: 'EventMap', 0x14: 'Event',
  0x15: 'PropertyMap', 0x17: 'Property', 0x18: 'MethodSemantics',
  0x19: 'MethodImpl', 0x1a: 'ModuleRef', 0x1b: 'TypeSpec',
  0x1c: 'ImplMap', 0x1d: 'FieldRVA', 0x20: 'Assembly',
  0x21: 'AssemblyProcessor', 0x22: 'AssemblyOS', 0x23: 'AssemblyRef',
  0x24: 'AssemblyRefProcessor', 0x25: 'AssemblyRefOS',
  0x26: 'File', 0x27: 'ExportedType', 0x28: 'ManifestResource',
  0x29: 'NestedClass', 0x2a: 'GenericParam', 0x2b: 'MethodSpec',
  0x2c: 'GenericParamConstraint',
};

/** Compute coded index size: 2 bytes if max(rows of referenced tables) < 2^(16-tagBits), else 4. */
const codedIndexSize = (header: TableHeader, tagBits: number, tableIds: number[]): number => {
  let maxRows = 0;
  for (const t of tableIds) maxRows = Math.max(maxRows, header.rowCounts[t] || 0);
  return maxRows < (1 << (16 - tagBits)) ? 2 : 4;
};

const parseTableHeader = (stream: Uint8Array): TableHeader => {
  const r: PEReader = { bytes: stream, pos: 0 };
  const reserved0 = u32adv(r);
  const majorVer = u8(r);
  const minorVer = u8(r);
  void reserved0; void majorVer; void minorVer;
  const heapSizes = u8(r);
  void u8(r); // reserved
  const validTables = BigInt(u32adv(r)) | (BigInt(u32adv(r)) << 32n);
  const sortedTables = BigInt(u32adv(r)) | (BigInt(u32adv(r)) << 32n);

  const rowCounts: number[] = new Array(64).fill(0);
  for (let i = 0; i < 64; i++) {
    if (validTables & (1n << BigInt(i))) {
      rowCounts[i] = u32adv(r);
    }
  }
  return {
    heapIndexSizes: {
      strings: (heapSizes & 1) ? 4 : 2,
      guid: (heapSizes & 2) ? 4 : 2,
      blob: (heapSizes & 4) ? 4 : 2,
    },
    validTables,
    sortedTables,
    rowCounts,
  };
};

interface TypeDefRow {
  typeName: string;
  typeNamespace: string;
  methodListStart: number;
}

interface MethodDefRow {
  name: string;
  rva: number;
  implFlags: number;
  flags: number;
}

const readTableIndex = (r: PEReader, count: number): number => {
  if (count < 65536) { const v = u16(r); r.pos += 2; return v; }
  return u32adv(r);
};

const readHeapIndex = (r: PEReader, size: number): number => {
  if (size === 2) { const v = u16(r); r.pos += 2; return v; }
  return u32adv(r);
};

/** Navigate the #~ stream: skip tables 0x00..0x01, parse TypeDef (0x02),
 *  skip 0x03..0x05, then parse MethodDef (0x06). Returns both row sets. */
const parseTypeDefAndMethodDef = (
  stream: Uint8Array,
  header: TableHeader,
  stringsHeap: Uint8Array,
): { typeDefs: TypeDefRow[]; methodDefs: MethodDefRow[] } => {
  const r: PEReader = { bytes: stream, pos: 8 };
  // skip row counts array
  for (let i = 0; i < 64; i++) {
    if (header.validTables & (1n << BigInt(i))) r.pos += 4;
  }
  const strSz = header.heapIndexSizes.strings;
  const guidSz = header.heapIndexSizes.guid;
  const blobSz = header.heapIndexSizes.blob;

  // --- Skip Module table (0x00) ---
  // Columns: Generation(u2) + Name(str) + Mvid(guid) + EncId(guid) + EncBaseId(guid)
  const moduleRows = header.rowCounts[0x00] || 0;
  const moduleRowSize = 2 + strSz + guidSz * 3;
  r.pos += moduleRows * moduleRowSize;

  // --- Skip TypeRef table (0x01) ---
  // Columns: ResolutionScope(coded) + Name(str) + Namespace(str)
  // ResolutionScope: 2 tag bits, tables: Module(0), ModuleRef(0x1a), AssemblyRef(0x23), TypeRef(0x01)
  const typeRefRows = header.rowCounts[0x01] || 0;
  const resolScopeSize = codedIndexSize(header, 2, [0x00, 0x1a, 0x23, 0x01]);
  const typeRefRowSize = resolScopeSize + strSz * 2;
  r.pos += typeRefRows * typeRefRowSize;

  // --- Parse TypeDef table (0x02) ---
  // Columns: Flags(u4) + Name(str) + Namespace(str) + Extends(TypeDefOrRef coded) + FieldList(Field idx) + MethodList(MethodDef idx)
  const typeDefRows = header.rowCounts[TABLE_TYPEDEF] || 0;
  const extendsSize = codedIndexSize(header, 2, [TABLE_TYPEDEF, TABLE_TYPEREF, 0x1b]);
  const fieldIdxSize = (header.rowCounts[0x04] || 0) < 65536 ? 2 : 4;
  const methodIdxSize = (header.rowCounts[TABLE_METHODDEF] || 0) < 65536 ? 2 : 4;
  const typeDefs: TypeDefRow[] = [];
  for (let i = 0; i < typeDefRows; i++) {
    u32adv(r); // Flags
    const nameIdx = readHeapIndex(r, strSz);
    const nsIdx = readHeapIndex(r, strSz);
    r.pos += extendsSize; // Extends
    readTableIndex(r, header.rowCounts[0x04] || 1); // FieldList (already uses fieldIdxSize via readTableIndex)
    const methodList = readTableIndex(r, header.rowCounts[TABLE_METHODDEF] || 1);
    typeDefs.push({
      typeName: readHeapString(stringsHeap, nameIdx),
      typeNamespace: readHeapString(stringsHeap, nsIdx),
      methodListStart: methodList,
    });
  }

  // --- Skip FieldPtr (0x03), Field (0x04), MethodPtr (0x05) ---
  // FieldPtr: Field index
  const fieldPtrRows = header.rowCounts[0x03] || 0;
  r.pos += fieldPtrRows * fieldIdxSize;
  // Field: Flags(u2) + Name(str) + Signature(blob)
  const fieldRows = header.rowCounts[0x04] || 0;
  const fieldRowSize = 2 + strSz + blobSz;
  r.pos += fieldRows * fieldRowSize;
  // MethodPtr: Method index
  const methodPtrRows = header.rowCounts[0x05] || 0;
  r.pos += methodPtrRows * methodIdxSize;

  // --- Parse MethodDef table (0x06) ---
  // Columns: RVA(u4) + ImplFlags(u2) + Flags(u2) + Name(str) + Signature(blob) + ParamList(Param idx)
  const methodRows = header.rowCounts[TABLE_METHODDEF] || 0;
  const paramIdxSize = (header.rowCounts[0x08] || 0) < 65536 ? 2 : 4;
  const methodDefs: MethodDefRow[] = [];
  for (let i = 0; i < methodRows; i++) {
    const rva = u32adv(r);
    const implFlags = u16adv(r);
    const flags = u16adv(r);
    const nameIdx = readHeapIndex(r, strSz);
    r.pos += blobSz; // Signature
    r.pos += paramIdxSize; // ParamList
    methodDefs.push({
      name: readHeapString(stringsHeap, nameIdx),
      rva,
      implFlags,
      flags,
    });
  }

  return { typeDefs, methodDefs };
};

const disasmMethodBody = (bytes: Uint8Array, pe: PEInfo, rva: number): string[] => {
  const L: string[] = [];
  if (rva === 0) return ['    (无方法体, abstract/extern)'];
  const off = rvaToOffset(pe, rva);
  if (off >= bytes.length) return [`    (RVA 0x${rva.toString(16)} 超出文件范围)`];
  const headerByte = bytes[off];
  const isTiny = (headerByte & 0x03) === 0x02;
  let codeStart: number;
  let codeLen: number;
  let maxStack = 0;
  let localVarSigTok = 0;
  if (isTiny) {
    codeLen = headerByte >> 2;
    codeStart = off + 1;
  } else {
    // Fat header (12 bytes)
    const flags = (bytes[off] | (bytes[off + 1] << 8));
    const headerSize = (flags >> 12) * 4;
    maxStack = bytes[off + 2] | (bytes[off + 3] << 8);
    codeLen = (bytes[off + 4] | (bytes[off + 5] << 8) | (bytes[off + 6] << 16) | (bytes[off + 7] << 24)) >>> 0;
    localVarSigTok = (bytes[off + 8] | (bytes[off + 9] << 8) | (bytes[off + 10] << 16) | (bytes[off + 11] << 24)) >>> 0;
    codeStart = off + headerSize;
  }
  L.push(`    方法体: ${isTiny ? 'Tiny' : 'Fat'}  maxStack=${maxStack}${localVarSigTok ? ` locals=0x${localVarSigTok.toString(16)}` : ''}  codeLen=${codeLen}`);
  L.push('    ── IL 代码 ──');
  const code = bytes.slice(codeStart, codeStart + codeLen);
  let i = 0;
  while (i < code.length) {
    let op = code[i];
    let prefix = false;
    if (op === 0xfe) {
      op = code[i + 1];
      prefix = true;
    }
    const opname = prefix ? (CIL_OPCODES_PREFIX[op] ?? `prefix_0x${op.toString(16)}`) : (CIL_OPCODES[op] ?? `opcode_0x${op.toString(16)}`);
    let argStr = '';
    let advance = prefix ? 2 : 1;
    // Operand types (simplified)
    if (!prefix) {
      switch (op) {
        case 0x0e: case 0x0f: case 0x10: // ldarg.s/ldloc.s/stloc.s
          argStr = ` ${code[i + 1]}`; advance = 2; break;
        case 0x1c: // ldc.i4.s
          argStr = ` ${(code[i + 1] << 24) >> 24}`; advance = 2; break;
        case 0x1d: // ldc.i4
          argStr = ` ${(code[i + 1] | (code[i + 2] << 8) | (code[i + 3] << 16) | (code[i + 4] << 24)) | 0}`;
          advance = 5; break;
        case 0x1f: // ldc.r4
          advance = 5; argStr = ' (r4)'; break;
        case 0x20: // ldc.r8
          advance = 9; argStr = ' (r8)'; break;
        case 0x1e: // ldc.i8
          advance = 9; argStr = ' (i8)'; break;
        case 0x72: // ldstr - user string token
          { const tok = (code[i + 1] | (code[i + 2] << 8) | (code[i + 3] << 16) | (code[i + 4] << 24)) >>> 0;
            argStr = ` token=0x${tok.toString(16)}`; advance = 5; break; }
        case 0x6f: case 0x73: case 0x70: case 0x71: case 0x74: case 0x75: case 0x79:
        case 0x7b: case 0x7c: case 0x7d: case 0x7e: case 0x7f: case 0x80: case 0x8c: case 0x8d:
        case 0xa5: case 0xa2: case 0xa0: case 0x24: case 0x25: case 0x23: case 0x27: case 0xd0:
          { const tok = (code[i + 1] | (code[i + 2] << 8) | (code[i + 3] << 16) | (code[i + 4] << 24)) >>> 0;
            argStr = ` token=0x${tok.toString(16)}`; advance = 5; break; }
        case 0x38: case 0x39: case 0x3a: case 0x34: // br/brfalse/brtrue/beq (4-byte offset)
          { const off2 = ((code[i + 1] << 24) | (code[i + 2] << 16) | (code[i + 3] << 8) | code[i + 4]) | 0;
            argStr = ` -> ${i + off2}`; advance = 5; break; }
        case 0x2e: case 0x2f: case 0x30: case 0x31: case 0x32: case 0x33: // beq.s etc
          { const off2 = (code[i + 1] << 24) >> 24;
            argStr = ` -> ${i + off2}`; advance = 2; break; }
        default:
          if (op >= 0x27 && op <= 0x37) { // short branch
            const off2 = (code[i + 1] << 24) >> 24;
            argStr = ` -> ${i + off2}`; advance = 2;
          }
          break;
      }
    } else {
      // prefix opcodes operand
      if (op === 0x0f || op === 0x10 || op === 0x11) { argStr = ` ${code[i + 2]}`; advance = 3; }
      else if (op === 0x15 || op === 0x0c || op === 0x0d) { argStr = ` tok=0x${((code[i + 2] | (code[i + 3] << 8) | (code[i + 4] << 16) | (code[i + 5] << 24)) >>> 0).toString(16)}`; advance = 6; }
      else { advance = 2; }
    }
    const addr = i.toString(16).padStart(4, '0');
    L.push(`      ${addr}  ${opname.padEnd(16)}${argStr}`);
    i += advance;
    if (advance === 0) i += 1;
  }
  return L;
};

const parseDotNet = (bytes: Uint8Array): string => {
  if (bytes.length < 64) throw new Error('数据过短，无法解析 .NET PE 文件');
  const L: string[] = [];
  L.push('═══════════════════════════════════════════');
  L.push('  .NET 程序集解析 (PE + CLI)');
  L.push('═══════════════════════════════════════════');
  L.push('');

  const { pe, cli } = parsePE(bytes);
  L.push('── PE 头信息 ──');
  L.push(`  架构: ${pe.is64 ? 'PE32+ (64-bit)' : 'PE32 (32-bit)'}`);
  L.push(`  节区数: ${pe.numberOfSections}`);
  for (const s of pe.sectionHeaders) {
    L.push(`    [${s.name}] VA=0x${s.virtualAddress.toString(16)} VSize=0x${s.virtualSize.toString(16)} RawOff=0x${s.pointerToRawData.toString(16)}`);
  }
  L.push('');

  if (!cli) {
    L.push('⚠ 未找到 CLI 头 (不是 .NET 程序集)');
    return L.join('\n');
  }

  L.push('── CLI 头 ──');
  L.push(`  Metadata RVA: 0x${cli.metaRva.toString(16)}  Size: ${cli.metaSize} bytes`);
  L.push('');

  const meta = parseMetadata(bytes, pe, cli.metaRva);
  L.push('── 元数据根 ──');
  L.push(`  Runtime 版本: ${meta.version}`);
  L.push(`  #Strings: ${meta.stringsHeap.length} bytes`);
  L.push(`  #US: ${meta.userStringsHeap.length} bytes`);
  L.push(`  #Blob: ${meta.blobHeap.length} bytes`);
  L.push(`  #~ (tables): ${meta.tableStream.length} bytes`);
  L.push('');

  const header = parseTableHeader(meta.tableStream);
  L.push('── 元数据表行数 ──');
  for (let i = 0; i < 64; i++) {
    if (header.rowCounts[i] > 0) {
      L.push(`  [0x${i.toString(16).padStart(2, '0')}] ${TABLE_NAMES[i] ?? `Table_${i}`}: ${header.rowCounts[i]} 行`);
    }
  }
  L.push('');

  // Parse TypeDef and MethodDef tables
  const { typeDefs, methodDefs } = parseTypeDefAndMethodDef(meta.tableStream, header, meta.stringsHeap);

  L.push(`── 类型定义 (${typeDefs.length}) ──`);
  for (let ti = 0; ti < typeDefs.length; ti++) {
    const td = typeDefs[ti];
    const nextTd = ti + 1 < typeDefs.length ? typeDefs[ti + 1] : null;
    const methodEnd = nextTd ? nextTd.methodListStart : methodDefs.length;
    const methodStart = td.methodListStart;
    const count = Math.max(0, methodEnd - methodStart);
    L.push('');
    L.push(`  [类型 #${ti}] ${td.typeNamespace ? td.typeNamespace + '.' : ''}${td.typeName}`);
    L.push(`    方法数: ${count}`);
    for (let mi = methodStart; mi < methodEnd && mi < methodDefs.length; mi++) {
      const md = methodDefs[mi];
      const accessVal = md.flags & 0x0007;
      const accessStr = accessVal === 0x0006 ? 'public' : (accessVal === 0x0001 ? 'private' : 'method');
      L.push(`    ── ${accessStr} 方法: ${md.name} (RVA=0x${md.rva.toString(16)}) ──`);
      L.push(...disasmMethodBody(bytes, pe, md.rva));
    }
  }

  return L.join('\n');
};

/* ---------- Component ---------- */

const ToolComponent = (props: ToolProps) => (
  <AsyncTool
    {...props}
    toolName=".NET程序集解析"
    execute={async (input: string, _mode: string, _params: Record<string, unknown>, file: File | null): Promise<string> => {
      let hexData = input;
      if (file) {
        hexData = await readFileAsHex(file, 2 * 1024 * 1024);
      }
      const cleaned = hexData.replace(/\n\n.*$/s, '').replace(/\s/g, '');
      const bytes = parseHex(cleaned);
      return parseDotNet(bytes);
    }}
  />
);
export default ToolComponent;
