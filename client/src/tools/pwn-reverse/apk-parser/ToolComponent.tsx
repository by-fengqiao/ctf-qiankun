import AsyncTool from '../../_shared/AsyncTool';
import { readFileAsHex } from '../../_shared/inputUtils';
import { parseHex, readU32LE, readU16LE, bytesToText } from '../../_shared/hexUtils';
import type { ToolProps } from '../../types';

/* ---------- helpers ---------- */

const readUleb128 = (bytes: Uint8Array, offset: number): [number, number] => {
  let result = 0;
  let shift = 0;
  let pos = offset;
  while (pos < bytes.length && shift < 32) {
    const b: number = bytes[pos];
    result |= (b & 0x7f) << shift;
    pos++;
    if ((b & 0x80) === 0) break;
    shift += 7;
  }
  return [result >>> 0, pos - offset];
};

const stripReaderMsg = (hex: string): string => {
  const idx = hex.indexOf('\n\n(');
  return idx >= 0 ? hex.substring(0, idx) : hex;
};

/* ---------- ZIP helpers ---------- */

interface ZipEntry {
  name: string;
  dataOffset: number;
  compressedSize: number;
  uncompressedSize: number;
  compressionMethod: number;
  crc32: number;
}

const parseZipEntries = (bytes: Uint8Array): ZipEntry[] => {
  const entries: ZipEntry[] = [];
  for (let i = 0; i + 30 <= bytes.length; i++) {
    if (
      bytes[i] !== 0x50 ||
      bytes[i + 1] !== 0x4b ||
      bytes[i + 2] !== 0x03 ||
      bytes[i + 3] !== 0x04
    ) {
      continue;
    }
    const compressionMethod: number = readU16LE(bytes, i + 8);
    const crc32: number = readU32LE(bytes, i + 14);
    const compressedSize: number = readU32LE(bytes, i + 18);
    const uncompressedSize: number = readU32LE(bytes, i + 22);
    const filenameLen: number = readU16LE(bytes, i + 26);
    const extraLen: number = readU16LE(bytes, i + 28);
    const dataOffset: number = i + 30 + filenameLen + extraLen;
    const name: string = bytesToText(bytes.subarray(i + 30, i + 30 + filenameLen));
    entries.push({
      name,
      dataOffset,
      compressedSize,
      uncompressedSize,
      compressionMethod,
      crc32,
    });
    if (dataOffset + compressedSize < bytes.length) {
      i = dataOffset + compressedSize - 1;
    } else {
      break;
    }
  }
  return entries;
};

const decompressRawDeflate = async (data: Uint8Array): Promise<Uint8Array> => {
  const ds = new DecompressionStream('deflate-raw');
  const writer = ds.writable.getWriter();
  writer.write(new Uint8Array(data));
  writer.close();
  const reader = ds.readable.getReader();
  const chunks: Uint8Array[] = [];
  let totalLen = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      const copy = new Uint8Array(value);
      chunks.push(copy);
      totalLen += copy.length;
    }
  }
  const result = new Uint8Array(totalLen);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
};

/* ---------- AXML (binary AndroidManifest.xml) parsing ---------- */

const readAxmlLen = (bytes: Uint8Array, offset: number): [number, number] => {
  if (offset >= bytes.length) return [0, 0];
  const b: number = bytes[offset];
  if ((b & 0x80) !== 0) {
    if (offset + 1 >= bytes.length) return [0, 0];
    return [((b & 0x7f) << 8) | bytes[offset + 1], 2];
  }
  return [b, 1];
};

const parseAxmlStringPool = (bytes: Uint8Array): string[] => {
  const strings: string[] = [];
  if (bytes.length < 8) return strings;
  const mainType: number = readU16LE(bytes, 0);
  if (mainType !== 0x0001 && mainType !== 0x001c) {
    return strings;
  }
  const mainHeaderSize: number = readU16LE(bytes, 2);
  let offset: number = mainType === 0x0001 ? mainHeaderSize : 0;
  if (offset + 24 > bytes.length) return strings;
  const spType: number = readU16LE(bytes, offset);
  if (spType !== 0x001c) return strings;
  const spHeaderSize: number = readU16LE(bytes, offset + 2);
  const stringCount: number = readU32LE(bytes, offset + 8);
  const flags: number = readU32LE(bytes, offset + 16);
  const stringsStart: number = readU32LE(bytes, offset + 20);
  const isUtf8: boolean = (flags & 0x100) !== 0;
  const offsetsBase: number = offset + spHeaderSize;
  const stringsBase: number = offset + stringsStart;
  const maxStrings: number = Math.min(stringCount, 8000);
  for (let i = 0; i < maxStrings; i++) {
    const off: number = offsetsBase + i * 4;
    if (off + 4 > bytes.length) break;
    const strOff: number = readU32LE(bytes, off);
    const strPos: number = stringsBase + strOff;
    if (strPos >= bytes.length) {
      strings.push('');
      continue;
    }
    if (isUtf8) {
      const [charLen, charLenBytes] = readAxmlLen(bytes, strPos);
      const [, byteLenBytes] = readAxmlLen(bytes, strPos + charLenBytes);
      const dataStart: number = strPos + charLenBytes + byteLenBytes;
      // The byte length we read is not reliable across encoders; read until NUL.
      let dataEnd: number = dataStart;
      while (dataEnd < bytes.length && bytes[dataEnd] !== 0) dataEnd++;
      const sub = bytes.subarray(dataStart, dataEnd);
      strings.push(bytesToText(sub));
      void charLen;
    } else {
      const charLen: number = readU16LE(bytes, strPos);
      const dataStart: number = strPos + 2;
      const dataEnd: number = Math.min(dataStart + charLen * 2, bytes.length);
      const u16: number[] = [];
      for (let j = dataStart; j + 1 < dataEnd; j += 2) {
        u16.push(bytes[j] | (bytes[j + 1] << 8));
      }
      strings.push(String.fromCharCode(...u16));
    }
  }
  return strings;
};

interface ManifestInfo {
  packageName: string;
  permissions: string[];
  components: string[];
  launchers: string[];
}

const extractManifestInfo = (strings: string[]): ManifestInfo => {
  const permissions: string[] = [];
  const components: string[] = [];
  const launchers: string[] = [];
  for (const s of strings) {
    if (s.startsWith('android.permission.')) {
      permissions.push(s);
    } else if (
      /^[a-z][a-z0-9_]*(\.[a-zA-Z_][a-zA-Z0-9_]*)+$/.test(s) ||
      /^\.[A-Z][a-zA-Z0-9_]*$/.test(s)
    ) {
      components.push(s);
    } else if (
      s === 'android.intent.action.MAIN' ||
      s === 'android.intent.category.LAUNCHER'
    ) {
      launchers.push(s);
    }
  }
  const dnsStrings: string[] = strings.filter(
    (s: string) =>
      /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*){1,6}$/.test(s) &&
      s.length < 80 &&
      !s.startsWith('android.') &&
      !s.startsWith('java.'),
  );
  dnsStrings.sort((a: string, b: string) => a.length - b.length);
  const packageName: string = dnsStrings[0] ?? '';
  return { packageName, permissions, components, launchers };
};

/* ---------- DEX helpers ---------- */

interface DexHeader {
  version: string;
  checksum: number;
  fileSize: number;
  headerSize: number;
  stringIdsSize: number;
  stringIdsOff: number;
  typeIdsSize: number;
  typeIdsOff: number;
  methodIdsSize: number;
  methodIdsOff: number;
  classDefsSize: number;
  classDefsOff: number;
}

const parseDexHeader = (bytes: Uint8Array): DexHeader => {
  if (
    bytes[0] !== 0x64 ||
    bytes[1] !== 0x65 ||
    bytes[2] !== 0x78 ||
    bytes[3] !== 0x0a
  ) {
    throw new Error('不是有效的 DEX 文件（魔数不匹配，期望 64 65 78 0a）');
  }
  const version: string = bytesToText(bytes.subarray(4, 8)).replace(/\0/g, '');
  const checksum: number = readU32LE(bytes, 8);
  const fileSize: number = readU32LE(bytes, 32);
  const headerSize: number = readU32LE(bytes, 36);
  return {
    version,
    checksum,
    fileSize,
    headerSize,
    stringIdsSize: readU32LE(bytes, 56),
    stringIdsOff: readU32LE(bytes, 60),
    typeIdsSize: readU32LE(bytes, 64),
    typeIdsOff: readU32LE(bytes, 68),
    methodIdsSize: readU32LE(bytes, 88),
    methodIdsOff: readU32LE(bytes, 92),
    classDefsSize: readU32LE(bytes, 96),
    classDefsOff: readU32LE(bytes, 100),
  };
};

const readDexString = (bytes: Uint8Array, stringIdsOff: number, idx: number): string => {
  const idOff: number = stringIdsOff + idx * 4;
  if (idOff + 4 > bytes.length) return '';
  const dataOff: number = readU32LE(bytes, idOff);
  if (dataOff >= bytes.length) return '';
  const [, sizeLen] = readUleb128(bytes, dataOff);
  let pos: number = dataOff + sizeLen;
  const chars: number[] = [];
  while (pos < bytes.length && bytes[pos] !== 0) {
    chars.push(bytes[pos]);
    pos++;
  }
  return bytesToText(new Uint8Array(chars));
};

const parseDex = (bytes: Uint8Array): string[] => {
  const h: DexHeader = parseDexHeader(bytes);
  const L: string[] = [];
  L.push('── DEX 头 (Header) ──');
  L.push(`  魔数:        64 65 78 0a (dex\\n) ✓`);
  L.push(`  版本:        ${h.version}`);
  L.push(`  校验和:      0x${h.checksum.toString(16).padStart(8, '0')}`);
  L.push(`  文件大小:    ${h.fileSize} 字节`);
  L.push(`  头大小:      0x${h.headerSize.toString(16)} (${h.headerSize})`);
  L.push('');

  L.push('── 字符串表 (String IDs) ──');
  L.push(`  数量: ${h.stringIdsSize}`);
  const maxStrings: number = Math.min(h.stringIdsSize, 50);
  for (let i = 0; i < maxStrings; i++) {
    const s: string = readDexString(bytes, h.stringIdsOff, i);
    L.push(`    [${i}] ${s || '(空)'}`);
  }
  if (h.stringIdsSize > maxStrings) {
    L.push(`    ... (共 ${h.stringIdsSize} 个，仅显示前 ${maxStrings})`);
  }
  L.push('');

  L.push('── 类型表 (Type IDs) ──');
  L.push(`  数量: ${h.typeIdsSize}`);
  const maxTypes: number = Math.min(h.typeIdsSize, 30);
  for (let i = 0; i < maxTypes; i++) {
    const typeIdx: number = readU32LE(bytes, h.typeIdsOff + i * 4);
    const s: string = readDexString(bytes, h.stringIdsOff, typeIdx);
    L.push(`    [${i}] ${s || '(空)'}`);
  }
  if (h.typeIdsSize > maxTypes) {
    L.push(`    ... (共 ${h.typeIdsSize} 个，仅显示前 ${maxTypes})`);
  }
  L.push('');

  L.push('── 方法表 (Method IDs) ──');
  L.push(`  数量: ${h.methodIdsSize}`);
  const maxMethods: number = Math.min(h.methodIdsSize, 20);
  for (let i = 0; i < maxMethods; i++) {
    const off: number = h.methodIdsOff + i * 8;
    if (off + 8 > bytes.length) break;
    const classIdx: number = readU16LE(bytes, off);
    const nameIdx: number = readU32LE(bytes, off + 4);
    const className: string = readDexString(
      bytes,
      h.stringIdsOff,
      readU32LE(bytes, h.typeIdsOff + classIdx * 4),
    );
    const methodName: string = readDexString(bytes, h.stringIdsOff, nameIdx);
    L.push(`    [${i}] ${className}->${methodName}`);
  }
  if (h.methodIdsSize > maxMethods) {
    L.push(`    ... (共 ${h.methodIdsSize} 个，仅显示前 ${maxMethods})`);
  }
  L.push('');

  L.push('── 类定义 (Class Defs) ──');
  L.push(`  数量: ${h.classDefsSize}`);
  const maxClasses: number = Math.min(h.classDefsSize, 30);
  for (let i = 0; i < maxClasses; i++) {
    const off: number = h.classDefsOff + i * 32;
    if (off + 32 > bytes.length) break;
    const classIdx: number = readU32LE(bytes, off);
    const accessFlags: number = readU32LE(bytes, off + 4);
    const superIdx: number = readU32LE(bytes, off + 8);
    const classType: number = readU32LE(bytes, h.typeIdsOff + classIdx * 4);
    const superType: number =
      superIdx === 0xffffffff
        ? 0xffffffff
        : readU32LE(bytes, h.typeIdsOff + superIdx * 4);
    L.push(
      `    [${i}] ${readDexString(bytes, h.stringIdsOff, classType)} (access=0x${accessFlags.toString(16)})`,
    );
    if (superType !== 0xffffffff) {
      L.push(
        `        超类: ${readDexString(bytes, h.stringIdsOff, superType)}`,
      );
    }
  }
  if (h.classDefsSize > maxClasses) {
    L.push(`    ... (共 ${h.classDefsSize} 个，仅显示前 ${maxClasses})`);
  }
  return L;
};

/* ---------- APK analysis ---------- */

const analyzeApk = async (bytes: Uint8Array): Promise<string> => {
  const L: string[] = [];
  L.push('═══════════════════════════════════════════');
  L.push('  APK / DEX 解析报告');
  L.push('═══════════════════════════════════════════');
  L.push('');

  const isZip: boolean = bytes[0] === 0x50 && bytes[1] === 0x4b;
  const isDex: boolean =
    bytes[0] === 0x64 && bytes[1] === 0x65 && bytes[2] === 0x78 && bytes[3] === 0x0a;

  if (!isZip && !isDex) {
    throw new Error('输入既不是有效的 ZIP/APK 文件，也不是 DEX 文件');
  }

  if (isDex) {
    L.push('── 文件类型: DEX ──');
    L.push(...parseDex(bytes));
    return L.join('\n');
  }

  L.push('── 文件类型: APK (ZIP) ──');
  const entries: ZipEntry[] = parseZipEntries(bytes);
  L.push(`  ZIP 条目数: ${entries.length}`);
  L.push('');
  L.push('── ZIP 文件列表 ──');
  entries.forEach((e: ZipEntry) => {
    const method: string =
      e.compressionMethod === 0 ? 'stored' : e.compressionMethod === 8 ? 'deflate' : `method-${e.compressionMethod}`;
    L.push(
      `  ${e.name} (${e.compressedSize} -> ${e.uncompressedSize}, ${method})`,
    );
  });
  L.push('');

  const manifestEntry: ZipEntry | undefined = entries.find(
    (e: ZipEntry) => e.name.toLowerCase() === 'androidmanifest.xml',
  );
  if (!manifestEntry) {
    L.push('── 未找到 AndroidManifest.xml ──');
    return L.join('\n');
  }

  L.push('── AndroidManifest.xml 分析 ──');
  const manifestCompressed: Uint8Array = bytes.subarray(
    manifestEntry.dataOffset,
    manifestEntry.dataOffset + manifestEntry.compressedSize,
  );
  let manifestBytes: Uint8Array;
  if (manifestEntry.compressionMethod === 0) {
    manifestBytes = manifestCompressed;
  } else if (manifestEntry.compressionMethod === 8) {
    manifestBytes = await decompressRawDeflate(manifestCompressed);
  } else {
    L.push(`  不支持的压缩方式: ${manifestEntry.compressionMethod}`);
    return L.join('\n');
  }

  const strings: string[] = parseAxmlStringPool(manifestBytes);
  const info: ManifestInfo = extractManifestInfo(strings);

  L.push(`  包名: ${info.packageName || '(未识别)'}`);
  L.push('');
  L.push(`  权限 (${info.permissions.length} 个):`);
  if (info.permissions.length === 0) L.push('    (无)');
  info.permissions.forEach((p: string) => L.push(`    • ${p}`));
  L.push('');

  L.push(`  组件 (${info.components.length} 个):`);
  if (info.components.length === 0) L.push('    (无)');
  info.components.slice(0, 100).forEach((c: string) => L.push(`    • ${c}`));
  if (info.components.length > 100) {
    L.push(`    ... (共 ${info.components.length} 个，仅显示前 100)`);
  }
  L.push('');

  if (info.launchers.length > 0) {
    L.push('  启动入口:');
    info.launchers.forEach((l: string) => L.push(`    • ${l}`));
  }

  return L.join('\n');
};

/* ---------- Component ---------- */

const ToolComponent = (props: ToolProps) => (
  <AsyncTool
    {...props}
    toolName="APK/DEX解析"
    paramsConfig={[
      {
        name: 'mode',
        label: '解析模式',
        type: 'select',
        default: 'apk',
        options: [
          { value: 'apk', label: 'APK (ZIP)' },
          { value: 'dex', label: 'DEX' },
        ],
      },
    ]}
    execute={async (
      input: string,
      _mode: string,
      params: Record<string, unknown>,
      file: File | null,
    ) => {
      let hexData = input;
      if (file) {
        hexData = await readFileAsHex(file, 4 * 1024 * 1024);
      }
      const hexOnly: string = stripReaderMsg(hexData);
      const bytes: Uint8Array = parseHex(hexOnly);
      const mode: string = (params.mode as string) ?? 'apk';
      if (mode === 'dex') {
        parseDexHeader(bytes);
      }
      return analyzeApk(bytes);
    }}
  />
);
export default ToolComponent;
