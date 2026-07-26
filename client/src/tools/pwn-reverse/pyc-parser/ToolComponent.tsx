import AsyncTool from '../../_shared/AsyncTool';
import { readFileAsHex } from '../../_shared/inputUtils';
import { parseHex } from '../../_shared/hexUtils';
import type { ToolProps } from '../../types';

/* ---------- Python magic number → version ---------- */

const MAGIC_TABLE: Record<number, string> = {
  62211: '3.0',
  3090: '3.1',
  3180: '3.2',
  3190: '3.3',
  3350: '3.5',
  3351: '3.5',
  3379: '3.6',
  3390: '3.6',
  3394: '3.7',
  3400: '3.7',
  3413: '3.8',
  3425: '3.9',
  3430: '3.10',
  3439: '3.10',
  3495: '3.11',
  3531: '3.12',
  3571: '3.13',
};

const PY_OPCODES: Record<number, string> = {
  1: 'POP_TOP', 2: 'ROT_TWO', 3: 'ROT_THREE', 4: 'DUP_TOP', 5: 'DUP_TOP_TWO',
  9: 'NOP', 10: 'UNARY_POSITIVE', 11: 'UNARY_NEGATIVE', 12: 'UNARY_NOT',
  15: 'UNARY_INVERT', 19: 'BINARY_POWER', 20: 'BINARY_MULTIPLY',
  22: 'BINARY_MODULO', 23: 'BINARY_MATRIX_MULTIPLY', 24: 'BINARY_ADD',
  25: 'BINARY_SUBTRACT', 26: 'BINARY_SUBSCR', 27: 'BINARY_FLOOR_DIVIDE',
  28: 'BINARY_TRUE_DIVIDE', 62: 'BINARY_LSHIFT', 63: 'BINARY_RSHIFT',
  64: 'BINARY_AND', 65: 'BINARY_XOR', 66: 'BINARY_OR',
  68: 'GET_ITER', 71: 'PRINT_EXPR', 83: 'RETURN_VALUE',
  86: 'YIELD_VALUE', 87: 'POP_BLOCK', 88: 'END_FINALLY',
  90: 'STORE_NAME', 91: 'DELETE_NAME', 92: 'UNPACK_SEQUENCE',
  93: 'FOR_ITER', 95: 'STORE_SUBSCR', 96: 'DELETE_SUBSCR',
  97: 'BINARY_OP', 100: 'LOAD_CONST', 101: 'LOAD_NAME',
  102: 'BUILD_TUPLE', 103: 'BUILD_LIST', 104: 'BUILD_SET',
  105: 'BUILD_MAP', 106: 'LOAD_ATTR', 107: 'COMPARE_OP',
  108: 'IMPORT_NAME', 109: 'IMPORT_FROM', 110: 'JUMP_FORWARD',
  111: 'JUMP_IF_FALSE_OR_POP', 112: 'JUMP_IF_TRUE_OR_POP',
  113: 'JUMP_ABSOLUTE', 114: 'POP_JUMP_IF_FALSE',
  115: 'POP_JUMP_IF_TRUE', 116: 'LOAD_GLOBAL',
  120: 'SETUP_LOOP', 121: 'SETUP_EXCEPT', 122: 'SETUP_FINALLY',
  124: 'LOAD_FAST', 125: 'STORE_FAST', 126: 'DELETE_FAST',
  131: 'CALL_FUNCTION', 132: 'MAKE_FUNCTION', 133: 'BUILD_SLICE',
  141: 'CALL_FUNCTION_KW', 142: 'CALL_FUNCTION_EX', 143: 'CALL_FUNCTION',
  144: 'EXTENDED_ARG', 145: 'LIST_APPEND', 146: 'SET_ADD',
  147: 'MAP_ADD', 148: 'LOAD_CLASSDEREF', 149: 'SETUP_WITH',
  155: 'UNPACK_EX', 160: 'FORMAT_VALUE', 161: 'BUILD_CONST_KEY_MAP',
  162: 'BUILD_STRING', 163: 'LOAD_METHOD', 164: 'CALL_METHOD',
  166: 'PRECALL', 167: 'CALL', 168: 'KW_NAMES', 171: 'COPY',
  173: 'SWAP', 175: 'PUSH_NULL',
};

/* ---------- Marshal parser ---------- */

interface MarshalObj {
  type: string;
  // for code objects
  argcount?: number;
  posonlyargcount?: number;
  kwonlyargcount?: number;
  nlocals?: number;
  stacksize?: number;
  flags?: number;
  code?: Uint8Array;
  consts?: MarshalObj[];
  names?: MarshalObj[];
  varnames?: MarshalObj[];
  freevars?: MarshalObj[];
  cellvars?: MarshalObj[];
  filename?: string;
  name?: string;
  firstlineno?: number;
  // for basic types
  value?: string | number | boolean | null;
  items?: MarshalObj[];
}

interface MarshalReader {
  bytes: Uint8Array;
  pos: number;
  refs: MarshalObj[];
}

const readI32 = (r: MarshalReader): number => {
  const v = (r.bytes[r.pos]) | (r.bytes[r.pos + 1] << 8) | (r.bytes[r.pos + 2] << 16) | (r.bytes[r.pos + 3] << 24);
  r.pos += 4;
  return v;
};

const readI64 = (r: MarshalReader): bigint => {
  let v = 0n;
  for (let i = 0; i < 8; i++) v |= BigInt(r.bytes[r.pos + i]) << BigInt(i * 8);
  r.pos += 8;
  return v;
};

const readBytes = (r: MarshalReader, n: number): Uint8Array => {
  const out = r.bytes.slice(r.pos, r.pos + n);
  r.pos += n;
  return out;
};

const readObj = (r: MarshalReader): MarshalObj => {
  if (r.pos >= r.bytes.length) throw new Error('marshal: 意外结束');
  let typeByte = r.bytes[r.pos];
  r.pos += 1;
  const flagRef = (typeByte & 0x80) !== 0;
  typeByte &= 0x7f;
  let obj: MarshalObj;

  switch (typeByte) {
    case 0x4e: // 'N' None
      obj = { type: 'none', value: null };
      break;
    case 0x54: // 'T' True
      obj = { type: 'bool', value: true };
      break;
    case 0x46: // 'F' False
      obj = { type: 'bool', value: false };
      break;
    case 0x69: { // 'i' int32
      obj = { type: 'int', value: readI32(r) };
      break;
    }
    case 0x49: { // 'I' int64
      obj = { type: 'int', value: Number(readI64(r)) };
      break;
    }
    case 0x67: { // 'g' binary float
      const buf = readBytes(r, 8);
      const view = new DataView(buf.buffer.slice(buf.byteOffset, buf.byteOffset + 8));
      obj = { type: 'float', value: view.getFloat64(0, true) };
      break;
    }
    case 0x73: // 's' string (bytes)
    case 0x74: // 't' interned
    case 0x75: { // 'u' unicode
      const n = readI32(r);
      const data = readBytes(r, n);
      obj = { type: 'bytes', value: new TextDecoder('utf-8', { fatal: false }).decode(data) };
      break;
    }
    case 0x7a: // 'z' short ascii
    case 0x5a: { // 'Z' short ascii interned
      const n = r.bytes[r.pos];
      r.pos += 1;
      const data = readBytes(r, n);
      obj = { type: 'str', value: new TextDecoder('ascii').decode(data) };
      break;
    }
    case 0x61: // 'a' ascii
    case 0x41: { // 'A' ascii interned
      const n = readI32(r);
      const data = readBytes(r, n);
      obj = { type: 'str', value: new TextDecoder('ascii').decode(data) };
      break;
    }
    case 0x29: { // ')' small tuple
      const n = r.bytes[r.pos];
      r.pos += 1;
      const items: MarshalObj[] = [];
      for (let i = 0; i < n; i++) items.push(readObj(r));
      obj = { type: 'tuple', items };
      break;
    }
    case 0x28: { // '(' tuple
      const n = readI32(r);
      const items: MarshalObj[] = [];
      for (let i = 0; i < n; i++) items.push(readObj(r));
      obj = { type: 'tuple', items };
      break;
    }
    case 0x72: { // 'r' ref
      const idx = readI32(r);
      obj = r.refs[idx] ?? { type: 'ref' };
      break;
    }
    case 0x63: { // 'c' code object
      obj = parseCodeObject(r);
      break;
    }
    case 0x2e: // '.' stop
      obj = { type: 'stop' };
      break;
    default:
      obj = { type: 'unknown', value: `0x${typeByte.toString(16)}` };
      break;
  }
  if (flagRef) r.refs.push(obj);
  return obj;
};

const parseCodeObject = (r: MarshalReader): MarshalObj => {
  const argcount = readI32(r);
  const posonlyargcount = readI32(r);
  const kwonlyargcount = readI32(r);
  const nlocals = readI32(r);
  const stacksize = readI32(r);
  const flags = readI32(r);
  const codeObj = readObj(r);
  const codeBytes = typeof codeObj.value === 'string'
    ? new TextEncoder().encode(codeObj.value)
    : new Uint8Array(0);
  const consts = readObj(r);
  const names = readObj(r);
  const varnames = readObj(r);
  const freevars = readObj(r);
  const cellvars = readObj(r);
  const filename = readObj(r);
  const name = readObj(r);
  const firstlineno = readI32(r);
  // lnotab / linetable
  try {
    readObj(r);
  } catch {
    // ignore trailing parse errors
  }
  return {
    type: 'code',
    argcount,
    posonlyargcount,
    kwonlyargcount,
    nlocals,
    stacksize,
    flags,
    code: codeBytes,
    consts: consts.items ?? [],
    names: names.items ?? [],
    varnames: varnames.items ?? [],
    freevars: freevars.items ?? [],
    cellvars: cellvars.items ?? [],
    filename: typeof filename.value === 'string' ? filename.value : '',
    name: typeof name.value === 'string' ? name.value : '<module>',
    firstlineno,
  };
};

/* ---------- Bytecode disassembly ---------- */

const disasmBytecode = (code: Uint8Array, consts: MarshalObj[], names: MarshalObj[], varnames: MarshalObj[]): string[] => {
  const L: string[] = [];
  let i = 0;
  let extended = 0;
  while (i < code.length) {
    const op = code[i];
    const opname = PY_OPCODES[op] ?? `OPCODE_${op}`;
    let arg = 0;
    let argStr = '';
    if (code.length > i + 1) {
      arg = code[i + 1] | (extended << 8);
      extended = op === 144 ? arg : 0;
    }
    // Annotate argument
    if (op === 100) { // LOAD_CONST
      const c = consts[arg];
      argStr = c ? ` (${formatConst(c)})` : '';
    } else if (op === 101 || op === 90 || op === 116 || op === 108 || op === 163) { // LOAD_NAME/STORE_NAME/LOAD_GLOBAL/IMPORT_NAME/LOAD_METHOD
      const n = names[arg];
      argStr = n && typeof n.value === 'string' ? ` (${n.value})` : '';
    } else if (op === 124 || op === 125) { // LOAD_FAST/STORE_FAST
      const v = varnames[arg];
      argStr = v && typeof v.value === 'string' ? ` (${v.value})` : '';
    } else if (op === 110 || op === 111 || op === 113 || op === 114 || op === 115) { // jumps
      const target = arg;
      argStr = ` -> ${target}`;
    } else if (arg > 0 && op !== 144) {
      argStr = ` ${arg}`;
    }
    const addr = i.toString(16).padStart(4, '0');
    L.push(`  ${addr}  ${opname.padEnd(24)} ${arg}${argStr}`);
    i += 2;
  }
  return L;
};

const formatConst = (c: MarshalObj): string => {
  if (c.type === 'none') return 'None';
  if (c.type === 'bool') return String(c.value);
  if (c.type === 'int') return String(c.value);
  if (c.type === 'float') return String(c.value);
  if (c.type === 'str' || c.type === 'bytes') return JSON.stringify(c.value);
  if (c.type === 'tuple') return `(${(c.items ?? []).map(formatConst).join(', ')})`;
  if (c.type === 'code') return `<code ${c.name}>`;
  return c.type;
};

/* ---------- Main parse ---------- */

const parsePyc = (bytes: Uint8Array): string => {
  if (bytes.length < 16) throw new Error('数据过短，无法解析 .pyc 文件');
  const L: string[] = [];
  L.push('═══════════════════════════════════════════');
  L.push('  Python .pyc 字节码解析');
  L.push('═══════════════════════════════════════════');
  L.push('');

  // Magic number (first 2 bytes LE)
  const magic = bytes[0] | (bytes[1] << 8);
  const version = MAGIC_TABLE[magic] ?? `未知(magic=0x${magic.toString(16)})`;
  L.push('── 文件头 ──');
  L.push(`  Magic: ${bytes[0].toString(16).padStart(2, '0')} ${bytes[1].toString(16).padStart(2, '0')} 0d 0a (0x${magic.toString(16)})`);
  L.push(`  Python 版本: ${version}`);
  const isModern = magic >= 3390; // 3.6+ has 16-byte header
  let headerSize: number;
  if (magic >= 3495) {
    // 3.11+: magic(4) + flags(4) + timestamp(4) + size(4) = 16
    headerSize = 16;
    const flags = bytes[4] | (bytes[5] << 8) | (bytes[6] << 16) | (bytes[7] << 24);
    L.push(`  Flags: 0x${(flags >>> 0).toString(16)}${flags & 1 ? ' (hash-based)' : ''}`);
    const timestamp = new Date((bytes[8] | (bytes[9] << 8) | (bytes[10] << 16) | (bytes[11] << 24)) * 1000);
    L.push(`  Timestamp: ${isNaN(timestamp.getTime()) ? 'N/A' : timestamp.toISOString()}`);
    const size = bytes[12] | (bytes[13] << 8) | (bytes[14] << 16) | (bytes[15] << 24);
    L.push(`  Source size: ${size} bytes`);
  } else if (isModern) {
    // 3.7-3.10: magic(4) + flags(4) + timestamp(4) + size(4) = 16
    headerSize = 16;
    const timestamp = new Date((bytes[8] | (bytes[9] << 8) | (bytes[10] << 16) | (bytes[11] << 24)) * 1000);
    L.push(`  Timestamp: ${isNaN(timestamp.getTime()) ? 'N/A' : timestamp.toISOString()}`);
  } else {
    // older: magic(4) + timestamp(4) = 8
    headerSize = 8;
    const timestamp = new Date((bytes[4] | (bytes[5] << 8) | (bytes[6] << 16) | (bytes[7] << 24)) * 1000);
    L.push(`  Timestamp: ${isNaN(timestamp.getTime()) ? 'N/A' : timestamp.toISOString()}`);
  }
  L.push(`  Header size: ${headerSize} bytes`);
  L.push('');

  // Marshal parse
  const r: MarshalReader = { bytes, pos: headerSize, refs: [] };
  let codeObj: MarshalObj;
  try {
    codeObj = readObj(r);
  } catch (e) {
    L.push(`⚠ Marshal 解析失败: ${e instanceof Error ? e.message : '未知错误'}`);
    L.push('  (可能版本不兼容或数据损坏)');
    return L.join('\n');
  }

  if (codeObj.type !== 'code') {
    L.push(`⚠ 顶层对象不是 code object (type=${codeObj.type})`);
    return L.join('\n');
  }

  L.push('── Code Object 信息 ──');
  L.push(`  文件名: ${codeObj.filename}`);
  L.push(`  名称: ${codeObj.name}`);
  L.push(`  首行: ${codeObj.firstlineno}`);
  L.push(`  argcount: ${codeObj.argcount}  nlocals: ${codeObj.nlocals}  stacksize: ${codeObj.stacksize}`);
  L.push(`  flags: 0x${(codeObj.flags ?? 0).toString(16)}`);
  L.push('');

  // Constants table
  L.push('── 常量表 (co_consts) ──');
  const consts = codeObj.consts ?? [];
  consts.forEach((c, idx) => {
    L.push(`  [${idx}] ${formatConst(c)}`);
  });
  L.push('');

  // Names
  L.push('── 名称表 (co_names) ──');
  const names = codeObj.names ?? [];
  names.forEach((n, idx) => {
    L.push(`  [${idx}] ${typeof n.value === 'string' ? n.value : n.type}`);
  });
  L.push('');

  // Varnames
  const varnames = codeObj.varnames ?? [];
  if (varnames.length > 0) {
    L.push('── 局部变量名 (co_varnames) ──');
    varnames.forEach((v, idx) => {
      L.push(`  [${idx}] ${typeof v.value === 'string' ? v.value : v.type}`);
    });
    L.push('');
  }

  // Bytecode disassembly
  L.push('── 反汇编 (伪代码) ──');
  if (codeObj.code && codeObj.code.length > 0) {
    L.push(...disasmBytecode(codeObj.code, consts, names, varnames));
  } else {
    L.push('  (无字节码数据)');
  }
  L.push('');

  // Recursively disassemble nested code objects
  const nested = consts.filter((c) => c.type === 'code');
  for (const nc of nested) {
    L.push(`── 嵌套代码对象: ${nc.name} (line ${nc.firstlineno}) ──`);
    if (nc.code) {
      L.push(...disasmBytecode(nc.code, nc.consts ?? [], nc.names ?? [], nc.varnames ?? []));
    }
    L.push('');
  }

  return L.join('\n');
};

/* ---------- Component ---------- */

const ToolComponent = (props: ToolProps) => (
  <AsyncTool
    {...props}
    toolName="Python字节码解析"
    execute={async (input: string, _mode: string, _params: Record<string, unknown>, file: File | null): Promise<string> => {
      let hexData = input;
      if (file) {
        hexData = await readFileAsHex(file, 1024 * 1024);
      }
      const cleaned = hexData.replace(/\n\n.*$/s, '').replace(/\s/g, '');
      const bytes = parseHex(cleaned);
      return parsePyc(bytes);
    }}
  />
);
export default ToolComponent;
