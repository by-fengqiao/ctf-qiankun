import AsyncTool from '../../_shared/AsyncTool';
import { readFileAsHex } from '../../_shared/inputUtils';
import { parseHex } from '../../_shared/hexUtils';
import type { ToolProps } from '../../types';

/* ---------- Java .class parser ---------- */

const CLASS_MAGIC = 0xcafebabe;

const CP_TAGS: Record<number, string> = {
  1: 'Utf8', 3: 'Integer', 4: 'Float', 5: 'Long', 6: 'Double',
  7: 'Class', 8: 'String', 9: 'Fieldref', 10: 'Methodref',
  11: 'InterfaceMethodref', 12: 'NameAndType', 15: 'MethodHandle',
  16: 'MethodType', 17: 'Dynamic', 18: 'InvokeDynamic',
  19: 'Module', 20: 'Package',
};

const ACCESS_FLAGS_CLASS: Record<number, string> = {
  0x0001: 'public', 0x0010: 'final', 0x0020: 'super',
  0x0200: 'interface', 0x0400: 'abstract', 0x1000: 'synthetic',
  0x2000: 'annotation', 0x4000: 'enum', 0x8000: 'module',
};

const ACCESS_FLAGS_FIELD: Record<number, string> = {
  0x0001: 'public', 0x0002: 'private', 0x0004: 'protected',
  0x0008: 'static', 0x0010: 'final', 0x0040: 'volatile',
  0x0080: 'transient', 0x1000: 'synthetic', 0x4000: 'enum',
};

const ACCESS_FLAGS_METHOD: Record<number, string> = {
  0x0001: 'public', 0x0002: 'private', 0x0004: 'protected',
  0x0008: 'static', 0x0010: 'final', 0x0020: 'synchronized',
  0x0040: 'bridge', 0x0080: 'varargs', 0x0100: 'native',
  0x0400: 'abstract', 0x0800: 'strict', 0x1000: 'synthetic',
};

const JVM_OPCODES: Record<number, string> = {
  0x00: 'nop', 0x01: 'aconst_null', 0x02: 'iconst_m1', 0x03: 'iconst_0',
  0x04: 'iconst_1', 0x05: 'iconst_2', 0x06: 'iconst_3', 0x07: 'iconst_4',
  0x08: 'iconst_5', 0x09: 'lconst_0', 0x0a: 'lconst_1', 0x0b: 'fconst_0',
  0x0c: 'dconst_0', 0x0d: 'dconst_1', 0x10: 'bipush', 0x11: 'sipush',
  0x12: 'ldc', 0x13: 'ldc_w', 0x14: 'ldc2_w',
  0x15: 'iload', 0x16: 'lload', 0x17: 'fload', 0x18: 'dload', 0x19: 'aload',
  0x1a: 'iload_0', 0x1b: 'iload_1', 0x1c: 'iload_2', 0x1d: 'iload_3',
  0x1e: 'lload_0', 0x1f: 'lload_1', 0x20: 'lload_2', 0x21: 'lload_3',
  0x22: 'fload_0', 0x23: 'fload_1', 0x24: 'fload_2', 0x25: 'fload_3',
  0x26: 'dload_0', 0x27: 'dload_1', 0x28: 'dload_2', 0x29: 'dload_3',
  0x2a: 'aload_0', 0x2b: 'aload_1', 0x2c: 'aload_2', 0x2d: 'aload_3',
  0x2e: 'iaload', 0x2f: 'laload', 0x32: 'aaload', 0x33: 'baload',
  0x34: 'caload', 0x35: 'saload',
  0x36: 'istore', 0x37: 'lstore', 0x38: 'fstore', 0x39: 'dstore', 0x3a: 'astore',
  0x3b: 'istore_0', 0x3c: 'istore_1', 0x3d: 'istore_2', 0x3e: 'istore_3',
  0x4b: 'astore_0', 0x4c: 'astore_1', 0x4d: 'astore_2', 0x4e: 'astore_3',
  0x57: 'pop', 0x58: 'pop2', 0x59: 'dup', 0x5a: 'dup_x1', 0x5b: 'dup_x2',
  0x60: 'iadd', 0x61: 'ladd', 0x64: 'isub', 0x65: 'lsub',
  0x68: 'imul', 0x69: 'lmul', 0x6c: 'idiv', 0x6d: 'ldiv',
  0x70: 'irem', 0x71: 'lrem', 0x74: 'ineg', 0x75: 'lneg',
  0x78: 'ishl', 0x7a: 'iushr', 0x7e: 'iand', 0x80: 'ior', 0x82: 'ixor',
  0x84: 'iinc',
  0x85: 'i2l', 0x86: 'i2f', 0x87: 'i2d', 0x88: 'l2i', 0x89: 'l2f',
  0x91: 'i2b', 0x92: 'i2c', 0x93: 'i2s',
  0x94: 'lcmp', 0x95: 'fcmpl', 0x96: 'fcmpg', 0x97: 'dcmpl', 0x98: 'dcmpg',
  0x99: 'ifeq', 0x9a: 'ifne', 0x9b: 'iflt', 0x9c: 'ifge', 0x9d: 'ifgt', 0x9e: 'ifle',
  0x9f: 'if_icmpeq', 0xa0: 'if_icmpne', 0xa1: 'if_icmplt', 0xa2: 'if_icmpge',
  0xa3: 'if_icmpgt', 0xa4: 'if_icmple', 0xa5: 'if_acmpeq', 0xa6: 'if_acmpne',
  0xa7: 'goto', 0xa8: 'jsr', 0xa9: 'ret',
  0xac: 'ireturn', 0xad: 'lreturn', 0xae: 'freturn', 0xaf: 'dreturn',
  0xb0: 'areturn', 0xb1: 'return',
  0xb2: 'getstatic', 0xb3: 'putstatic', 0xb4: 'getfield', 0xb5: 'putfield',
  0xb6: 'invokevirtual', 0xb7: 'invokespecial', 0xb8: 'invokestatic',
  0xb9: 'invokeinterface', 0xba: 'invokedynamic',
  0xbb: 'new', 0xbc: 'newarray', 0xbd: 'anewarray',
  0xbe: 'arraylength', 0xbf: 'athrow', 0xc0: 'checkcast', 0xc1: 'instanceof',
  0xc2: 'monitorenter', 0xc3: 'monitorexit',
  0xc4: 'wide', 0xc5: 'multianewarray',
  0xc6: 'ifnull', 0xc7: 'ifnonnull', 0xc8: 'goto_w', 0xc9: 'jsr_w',
};

interface ClassReader {
  bytes: Uint8Array;
  pos: number;
}

const u2 = (r: ClassReader): number => {
  const v = (r.bytes[r.pos] << 8) | r.bytes[r.pos + 1];
  r.pos += 2;
  return v;
};

const u4 = (r: ClassReader): number => {
  const v = ((r.bytes[r.pos] << 24) | (r.bytes[r.pos + 1] << 16) | (r.bytes[r.pos + 2] << 8) | r.bytes[r.pos + 3]) >>> 0;
  r.pos += 4;
  return v;
};

const readBytes = (r: ClassReader, n: number): Uint8Array => {
  const out = r.bytes.slice(r.pos, r.pos + n);
  r.pos += n;
  return out;
};

interface CpEntry {
  tag: number;
  tagName: string;
  // for Utf8
  str?: string;
  // for Class
  nameIndex?: number;
  // for ref types
  classIndex?: number;
  nameAndTypeIndex?: number;
  // for NameAndType
  nameIndex2?: number;
  descIndex?: number;
  // for String
  stringIndex?: number;
  // for primitives
  value?: number | string;
}

const parseConstantPool = (r: ClassReader): CpEntry[] => {
  const count = u2(r);
  const pool: CpEntry[] = new Array(count);
  let i = 1;
  while (i < count) {
    const tag = r.bytes[r.pos];
    r.pos += 1;
    const tagName = CP_TAGS[tag] ?? `Tag_${tag}`;
    const entry: CpEntry = { tag, tagName };
    switch (tag) {
      case 1: { // Utf8
        const len = u2(r);
        const data = readBytes(r, len);
        entry.str = new TextDecoder('utf-8', { fatal: false }).decode(data);
        break;
      }
      case 3: case 4: { // Integer / Float
        entry.value = u4(r);
        break;
      }
      case 5: case 6: { // Long / Double (take 2 slots)
        u4(r); u4(r);
        break;
      }
      case 7: { // Class
        entry.nameIndex = u2(r);
        break;
      }
      case 8: { // String
        entry.stringIndex = u2(r);
        break;
      }
      case 9: case 10: case 11: { // Fieldref / Methodref / InterfaceMethodref
        entry.classIndex = u2(r);
        entry.nameAndTypeIndex = u2(r);
        break;
      }
      case 12: { // NameAndType
        entry.nameIndex2 = u2(r);
        entry.descIndex = u2(r);
        break;
      }
      case 15: { // MethodHandle
        r.pos += 1; u2(r);
        break;
      }
      case 16: { // MethodType
        u2(r);
        break;
      }
      case 17: case 18: { // Dynamic / InvokeDynamic
        u2(r); u2(r);
        break;
      }
      case 19: case 20: { // Module / Package
        u2(r);
        break;
      }
      default:
        throw new Error(`未知常量池 tag: ${tag} @ index ${i}`);
    }
    pool[i] = entry;
    if (tag === 5 || tag === 6) i += 2; // Long/Double take 2 slots
    else i += 1;
  }
  return pool;
};

const cpUtf8 = (pool: CpEntry[], idx: number): string => {
  const e = pool[idx];
  return e?.str ?? `#${idx}`;
};

const cpClassName = (pool: CpEntry[], idx: number): string => {
  const e = pool[idx];
  if (e && e.nameIndex) return cpUtf8(pool, e.nameIndex);
  return `#${idx}`;
};

const cpRefStr = (pool: CpEntry[], idx: number): string => {
  const e = pool[idx];
  if (!e) return `#${idx}`;
  if (e.classIndex !== undefined && e.nameAndTypeIndex !== undefined) {
    const cls = cpClassName(pool, e.classIndex);
    const nt = pool[e.nameAndTypeIndex];
    if (nt && nt.nameIndex2 !== undefined && nt.descIndex !== undefined) {
      const name = cpUtf8(pool, nt.nameIndex2);
      const desc = cpUtf8(pool, nt.descIndex);
      return `${cls}.${name}:${desc}`;
    }
  }
  return `#${idx}`;
};

const decodeDescriptor = (desc: string): string => {
  // Simple Java type descriptor decode
  let i = 0;
  const parseType = (): string => {
    const c = desc[i];
    i++;
    switch (c) {
      case 'V': return 'void';
      case 'Z': return 'boolean';
      case 'B': return 'byte';
      case 'C': return 'char';
      case 'S': return 'short';
      case 'I': return 'int';
      case 'J': return 'long';
      case 'F': return 'float';
      case 'D': return 'double';
      case 'L': {
        let end = desc.indexOf(';', i);
        const name = desc.substring(i, end);
        i = end + 1;
        return name.replace(/\//g, '.');
      }
      case '[': return parseType() + '[]';
      default: return c;
    }
  };
  if (desc[0] === '(') {
    i = 1;
    const params: string[] = [];
    while (desc[i] !== ')') params.push(parseType());
    i++; // skip )
    const ret = parseType();
    return `(${params.join(', ')}) -> ${ret}`;
  }
  return parseType();
};

const flagsStr = (flags: number, table: Record<number, string>): string => {
  const parts: string[] = [];
  for (const [bit, name] of Object.entries(table)) {
    if (flags & Number(bit)) parts.push(name);
  }
  return parts.join(' ');
};

interface MethodInfo {
  accessFlags: number;
  name: string;
  descriptor: string;
  code: Uint8Array | null;
  maxStack: number;
  maxLocals: number;
}

interface FieldInfo {
  accessFlags: number;
  name: string;
  descriptor: string;
}

const parseAttributes = (r: ClassReader, pool: CpEntry[]): { code: Uint8Array | null; maxStack: number; maxLocals: number } => {
  const count = u2(r);
  let code: Uint8Array | null = null;
  let maxStack = 0;
  let maxLocals = 0;
  for (let i = 0; i < count; i++) {
    const nameIdx = u2(r);
    const name = cpUtf8(pool, nameIdx);
    const len = u4(r);
    const start = r.pos;
    if (name === 'Code') {
      maxStack = u2(r);
      maxLocals = u2(r);
      const codeLen = u4(r);
      code = readBytes(r, codeLen);
      // skip exception table
      const exLen = u2(r);
      r.pos += exLen * 8;
      // skip sub-attributes
      parseAttributes(r, pool);
    } else {
      r.pos = start + len;
    }
  }
  return { code, maxStack, maxLocals };
};

const parseFields = (r: ClassReader, pool: CpEntry[], count: number): FieldInfo[] => {
  const fields: FieldInfo[] = [];
  for (let i = 0; i < count; i++) {
    const accessFlags = u2(r);
    const nameIdx = u2(r);
    const descIdx = u2(r);
    const attrCount = u2(r);
    for (let a = 0; a < attrCount; a++) {
      const nameIdx2 = u2(r);
      const len = u4(r);
      r.pos += len;
    }
    fields.push({
      accessFlags,
      name: cpUtf8(pool, nameIdx),
      descriptor: cpUtf8(pool, descIdx),
    });
  }
  return fields;
};

const parseMethods = (r: ClassReader, pool: CpEntry[], count: number): MethodInfo[] => {
  const methods: MethodInfo[] = [];
  for (let i = 0; i < count; i++) {
    const accessFlags = u2(r);
    const nameIdx = u2(r);
    const descIdx = u2(r);
    const { code, maxStack, maxLocals } = parseAttributes(r, pool);
    methods.push({
      accessFlags,
      name: cpUtf8(pool, nameIdx),
      descriptor: cpUtf8(pool, descIdx),
      code,
      maxStack,
      maxLocals,
    });
  }
  return methods;
};

const disasmBytecode = (code: Uint8Array, pool: CpEntry[]): string[] => {
  const L: string[] = [];
  let i = 0;
  while (i < code.length) {
    const op = code[i];
    const opname = JVM_OPCODES[op] ?? `opcode_0x${op.toString(16)}`;
    let argStr = '';
    let advance = 1;
    if (op === 0x84) { // iinc
      const idx = code[i + 1];
      const incr = (code[i + 2] << 24) >> 24;
      argStr = ` ${idx}, ${incr}`;
      advance = 3;
    } else if (op === 0xc4) { // wide
      const op2 = code[i + 1];
      const idx = (code[i + 2] << 8) | code[i + 3];
      argStr = ` ${JVM_OPCODES[op2] ?? '0x' + op2.toString(16)} ${idx}`;
      advance = 4;
    } else if (op >= 0x10 && op <= 0x11) { // bipush/sipush
      const val = op === 0x10 ? (code[i + 1] << 24) >> 24 : ((code[i + 1] << 8) | code[i + 2] << 24) >> 16 >> 8;
      argStr = ` ${val}`;
      advance = op === 0x10 ? 2 : 3;
    } else if (op === 0x12) { // ldc
      const idx = code[i + 1];
      const e = pool[idx];
      argStr = ` ${e ? (e.str ?? `#${idx}`) : `#${idx}`}`;
      advance = 2;
    } else if (op === 0x13 || op === 0x14 || (op >= 0xb2 && op <= 0xb8) || op === 0xbd || op === 0xc0 || op === 0xc1 || op === 0xc5 || op === 0xbb) {
      // 2-byte index ops
      const idx = (code[i + 1] << 8) | code[i + 2];
      if (op === 0x13 || op === 0x14) {
        const e = pool[idx];
        argStr = ` ${e ? (e.str ?? `#${idx}`) : `#${idx}`}`;
      } else if (op === 0xbb) { // new
        argStr = ` ${cpClassName(pool, idx)}`;
      } else if (op >= 0xb2 && op <= 0xb5) {
        argStr = ` ${cpRefStr(pool, idx)}`;
      } else if (op === 0xb6 || op === 0xb7 || op === 0xb8) {
        argStr = ` ${cpRefStr(pool, idx)}`;
      } else if (op === 0xb9) { // invokeinterface
        argStr = ` ${cpRefStr(pool, idx)}`;
        advance = 5;
      } else {
        argStr = ` #${idx}`;
      }
      if (advance === 1) advance = 3;
    } else if (op === 0xb9) { // invokeinterface
      const idx = (code[i + 1] << 8) | code[i + 2];
      argStr = ` ${cpRefStr(pool, idx)}`;
      advance = 5;
    } else if (op >= 0x99 && op <= 0xa8) { // branch
      const off = ((code[i + 1] << 8) | code[i + 2] << 16) << 16 >> 24;
      argStr = ` -> ${i + off}`;
      advance = 3;
    } else if (op === 0xc8 || op === 0xc9) { // goto_w / jsr_w
      const off = ((code[i + 1] << 24) | (code[i + 2] << 16) | (code[i + 3] << 8) | code[i + 4]) | 0;
      argStr = ` -> ${i + off}`;
      advance = 5;
    } else if (op === 0xaa) { // tableswitch
      const pad = (4 - ((i + 1) % 4)) % 4;
      const base = i + 1 + pad;
      const def = ((code[base] << 24) | (code[base + 1] << 16) | (code[base + 2] << 8) | code[base + 3]) | 0;
      argStr = ` default -> ${i + def}`;
      advance = code.length - i; // skip rest
    } else if (op === 0xab) { // lookupswitch
      const pad = (4 - ((i + 1) % 4)) % 4;
      advance = code.length - i;
      argStr = ' (lookupswitch)';
    }
    const addr = i.toString(16).padStart(4, '0');
    L.push(`  ${addr}  ${opname.padEnd(20)}${argStr}`);
    i += advance;
    if (advance === 0) i += 1; // safety
  }
  return L;
};

const parseClass = (bytes: Uint8Array): string => {
  if (bytes.length < 10) throw new Error('数据过短，无法解析 .class 文件');
  const r: ClassReader = { bytes, pos: 0 };
  const L: string[] = [];
  L.push('═══════════════════════════════════════════');
  L.push('  Java .class 文件解析');
  L.push('═══════════════════════════════════════════');
  L.push('');

  const magic = u4(r);
  if (magic !== CLASS_MAGIC) {
    throw new Error(`魔数不匹配: 期望 CAFEBABE, 实际 0x${magic.toString(16)}`);
  }
  L.push('── 文件头 ──');
  L.push(`  Magic: CAFEBABE ✓`);
  const minor = u2(r);
  const major = u2(r);
  const javaVersion: Record<number, string> = {
    52: 'Java 8', 55: 'Java 11', 59: 'Java 15', 60: 'Java 16',
    61: 'Java 17', 65: 'Java 21', 67: 'Java 23',
  };
  L.push(`  版本: ${major}.${minor} (${javaVersion[major] ?? `major=${major}`})`);
  L.push('');

  const pool = parseConstantPool(r);
  L.push(`── 常量池 (${pool.length - 1} 项) ──`);
  for (let i = 1; i < pool.length; i++) {
    const e = pool[i];
    if (!e) continue;
    let detail = '';
    if (e.tag === 1) detail = `"${e.str}"`;
    else if (e.tag === 7) detail = `name=#${e.nameIndex} (${cpClassName(pool, i)})`;
    else if (e.tag === 8) detail = `string=#${e.stringIndex}`;
    else if (e.classIndex !== undefined) detail = cpRefStr(pool, i);
    else if (e.nameIndex2 !== undefined) detail = `${cpUtf8(pool, e.nameIndex2)}:${cpUtf8(pool, e.descIndex)}`;
    L.push(`  #${i} = ${e.tagName}${detail ? '  ' + detail : ''}`);
  }
  L.push('');

  const accessFlags = u2(r);
  const thisClass = u2(r);
  const superClass = u2(r);
  L.push('── 类信息 ──');
  L.push(`  访问标志: 0x${accessFlags.toString(16)} [${flagsStr(accessFlags, ACCESS_FLAGS_CLASS)}]`);
  L.push(`  类名: ${cpClassName(pool, thisClass)}`);
  L.push(`  父类: ${superClass === 0 ? '(none)' : cpClassName(pool, superClass)}`);

  const interfacesCount = u2(r);
  L.push(`  接口数: ${interfacesCount}`);
  for (let i = 0; i < interfacesCount; i++) {
    const idx = u2(r);
    L.push(`    - ${cpClassName(pool, idx)}`);
  }
  L.push('');

  const fieldsCount = u2(r);
  const fields = parseFields(r, pool, fieldsCount);
  L.push(`── 字段表 (${fields.length}) ──`);
  for (const f of fields) {
    L.push(`  ${flagsStr(f.accessFlags, ACCESS_FLAGS_FIELD)} ${decodeDescriptor(f.descriptor)} ${f.name}`);
  }
  L.push('');

  const methodsCount = u2(r);
  const methods = parseMethods(r, pool, methodsCount);
  L.push(`── 方法表 (${methods.length}) ──`);
  methods.forEach((m, idx) => {
    L.push('');
    L.push(`  [方法 #${idx}] ${flagsStr(m.accessFlags, ACCESS_FLAGS_METHOD)} ${decodeDescriptor(m.descriptor)} ${m.name}`);
    if (m.code) {
      L.push(`    Code: maxStack=${m.maxStack} maxLocals=${m.maxLocals} len=${m.code.length}`);
      L.push('    ── 字节码 ──');
      L.push(...disasmBytecode(m.code, pool).map((line) => '    ' + line));
    } else {
      L.push('    (abstract/native, 无字节码)');
    }
  });

  // skip class attributes
  return L.join('\n');
};

/* ---------- Component ---------- */

const ToolComponent = (props: ToolProps) => (
  <AsyncTool
    {...props}
    toolName="Java-Class解析"
    execute={async (input: string, _mode: string, _params: Record<string, unknown>, file: File | null): Promise<string> => {
      let hexData = input;
      if (file) {
        hexData = await readFileAsHex(file, 2 * 1024 * 1024);
      }
      const cleaned = hexData.replace(/\n\n.*$/s, '').replace(/\s/g, '');
      const bytes = parseHex(cleaned);
      return parseClass(bytes);
    }}
  />
);
export default ToolComponent;
