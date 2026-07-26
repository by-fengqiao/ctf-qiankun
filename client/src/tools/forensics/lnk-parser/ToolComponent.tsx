import AsyncTool from '../../_shared/AsyncTool';
import { readFileAsHex } from '../../_shared/inputUtils';
import { parseHex, readU32LE, readU16LE } from '../../_shared/hexUtils';
import type { ToolProps } from '../../types';

/* ---------- Constants ---------- */

const EPOCH_OFFSET = 116444736000000000n;

const LNK_CLSID = [0x01, 0x14, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
                    0xC0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x46];

/* ---------- Helpers ---------- */

function readU64LE(bytes: Uint8Array, offset: number): bigint {
  let val = 0n;
  for (let i = 7; i >= 0; i--) {
    val = (val << 8n) | BigInt(bytes[offset + i]);
  }
  return val;
}

function filetimeToISO(ft: bigint): string {
  if (ft === 0n) return '(无)';
  if (ft < EPOCH_OFFSET) return '(无效)';
  const unixMs = Number((ft - EPOCH_OFFSET) / 10000n);
  if (unixMs < 0 || unixMs > 20000000000000) return '(无效)';
  return new Date(unixMs).toISOString();
}

function readWString(bytes: Uint8Array, offset: number, maxChars: number): string {
  const chars: string[] = [];
  for (let i = 0; i < maxChars && offset + i * 2 + 1 < bytes.length; i++) {
    const lo = bytes[offset + i * 2];
    const hi = bytes[offset + i * 2 + 1];
    if (lo === 0 && hi === 0) break;
    chars.push(String.fromCharCode(lo | (hi << 8)));
  }
  return chars.join('');
}

function readCString(bytes: Uint8Array, offset: number, maxLen: number): string {
  const chars: string[] = [];
  for (let i = 0; i < maxLen && offset + i < bytes.length; i++) {
    const b = bytes[offset + i];
    if (b === 0) break;
    chars.push(String.fromCharCode(b));
  }
  return chars.join('');
}

function flagsToList(flags: number, bits: { mask: number; name: string }[]): string {
  const parts: string[] = [];
  for (const bit of bits) {
    if (flags & bit.mask) parts.push(bit.name);
  }
  return parts.length > 0 ? parts.join(', ') : '(无)';
}

/* ---------- Main parse ---------- */

const parse = (bytes: Uint8Array): string => {
  if (bytes.length < 76) throw new Error('数据过短，无法解析 LNK 头');

  const L: string[] = [];
  L.push('═══════════════════════════════════════════');
  L.push('  LNK 快捷方式解析报告');
  L.push('═══════════════════════════════════════════');
  L.push('');

  const headerSize = readU32LE(bytes, 0) >>> 0;
  if (headerSize !== 0x4C) {
    throw new Error(`无效的 LNK HeaderSize: 0x${headerSize.toString(16)} (期望 0x4C)`);
  }

  let clsidMatch = true;
  for (let i = 0; i < 16; i++) {
    if (bytes[4 + i] !== LNK_CLSID[i]) { clsidMatch = false; break; }
  }

  const flags = readU32LE(bytes, 0x14) >>> 0;
  const fileAttrs = readU32LE(bytes, 0x18) >>> 0;
  const creationTime = readU64LE(bytes, 0x1C);
  const accessTime = readU64LE(bytes, 0x24);
  const writeTime = readU64LE(bytes, 0x2C);
  const fileSize = readU32LE(bytes, 0x34) >>> 0;
  const showCmd = readU32LE(bytes, 0x3C) >>> 0;
  const hotkeyKey = bytes[0x40];
  const hotkeyMod = bytes[0x41];

  L.push('── 基本信息 ──');
  L.push(`  CLSID: ${clsidMatch ? '00021401-0000-0000-C000-000000000046 ✓' : '(不匹配)'}`);

  const flagBits: { mask: number; name: string }[] = [
    { mask: 0x00000001, name: 'HasLinkTargetIDList' },
    { mask: 0x00000002, name: 'HasLinkInfo' },
    { mask: 0x00000004, name: 'HasName' },
    { mask: 0x00000008, name: 'HasRelativePath' },
    { mask: 0x00000010, name: 'HasWorkingDir' },
    { mask: 0x00000020, name: 'HasArguments' },
    { mask: 0x00000040, name: 'HasIconLocation' },
    { mask: 0x00000080, name: 'IsUnicode' },
  ];
  L.push(`  Flags: 0x${flags.toString(16).padStart(8, '0').toUpperCase()} (${flagsToList(flags, flagBits)})`);

  const attrBits: { mask: number; name: string }[] = [
    { mask: 0x00000001, name: 'ReadOnly' },
    { mask: 0x00000002, name: 'Hidden' },
    { mask: 0x00000004, name: 'System' },
    { mask: 0x00000010, name: 'Directory' },
    { mask: 0x00000020, name: 'Archive' },
    { mask: 0x00000080, name: 'Normal' },
    { mask: 0x00000800, name: 'Compressed' },
    { mask: 0x00004000, name: 'Encrypted' },
  ];
  L.push(`  文件属性: 0x${fileAttrs.toString(16).padStart(8, '0').toUpperCase()} (${flagsToList(fileAttrs, attrBits)})`);
  L.push(`  文件大小: ${fileSize} 字节`);

  const showNames: Record<number, string> = { 1: 'Normal', 3: 'Maximized', 7: 'Minimized' };
  L.push(`  显示方式: ${showNames[showCmd] ?? showCmd}`);

  const modParts: string[] = [];
  if (hotkeyMod & 0x04) modParts.push('Alt');
  if (hotkeyMod & 0x02) modParts.push('Ctrl');
  if (hotkeyMod & 0x01) modParts.push('Shift');
  const hotkeyStr = hotkeyKey > 0
    ? `${modParts.length > 0 ? modParts.join('+') + '+' : ''}${String.fromCharCode(hotkeyKey)}`
    : '(无)';
  L.push(`  热键: ${hotkeyStr}`);
  L.push('');

  L.push('── 时间信息 ──');
  L.push(`  创建时间: ${filetimeToISO(creationTime)}`);
  L.push(`  访问时间: ${filetimeToISO(accessTime)}`);
  L.push(`  修改时间: ${filetimeToISO(writeTime)}`);
  L.push('');

  let offset = headerSize;

  if (flags & 0x00000001) {
    const idListSize = readU16LE(bytes, offset);
    L.push('── LinkTargetIDList ──');
    L.push(`  IDList 大小: ${idListSize} 字节`);
    const pidlEnd = offset + 2 + idListSize;
    const pathChars: string[] = [];
    for (let i = offset + 2; i + 1 < Math.min(pidlEnd, bytes.length); i += 2) {
      const lo = bytes[i];
      const hi = bytes[i + 1];
      if (hi === 0 && (lo >= 0x20 && lo < 0x7f)) {
        pathChars.push(String.fromCharCode(lo));
      } else if (pathChars.length > 0 && pathChars[pathChars.length - 1] !== '|') {
        pathChars.push('|');
      }
    }
    const pidlStr = pathChars.join('').replace(/\|+/g, ' | ').replace(/^\| /, '').replace(/ \|$/, '');
    if (pidlStr) L.push(`  PIDL 路径片段: ${pidlStr}`);
    offset = pidlEnd;
    L.push('');
  }

  if ((flags & 0x00000002) && !(flags & 0x00000100)) {
    if (offset + 24 <= bytes.length) {
      const linkInfoSize = readU32LE(bytes, offset) >>> 0;
      const linkInfoFlags = readU32LE(bytes, offset + 8) >>> 0;
      const volIdOffset = readU32LE(bytes, offset + 0x0C) >>> 0;
      const basePathOffset = readU32LE(bytes, offset + 0x10) >>> 0;
      const basePathUnicodeOffset = readU32LE(bytes, offset + 0x1C) >>> 0;

      L.push('── LinkInfo ──');
      L.push(`  LinkInfoFlags: 0x${linkInfoFlags.toString(16).padStart(8, '0').toUpperCase()}`);

      if (volIdOffset > 0) {
        const volAbs = offset + volIdOffset;
        if (volAbs + 0x10 < bytes.length) {
          const serial = readU32LE(bytes, volAbs + 0x08) >>> 0;
          L.push(`  卷序列号: 0x${serial.toString(16).padStart(8, '0').toUpperCase()}`);
        }
      }

      let targetPath = '';
      if (linkInfoFlags & 0x04 && basePathUnicodeOffset > 0) {
        targetPath = readWString(bytes, offset + basePathUnicodeOffset, 260);
      } else if (basePathOffset > 0) {
        targetPath = readCString(bytes, offset + basePathOffset, 260);
      }
      if (targetPath) L.push(`  目标路径: ${targetPath}`);

      offset += linkInfoSize;
      L.push('');
    }
  }

  L.push('── StringData ──');
  const isUnicode = (flags & 0x00000080) !== 0;

  if (flags & 0x00000004) {
    const charCount = readU16LE(bytes, offset);
    offset += 2;
    const desc = isUnicode ? readWString(bytes, offset, charCount) : readCString(bytes, offset, charCount);
    offset += isUnicode ? charCount * 2 : charCount;
    L.push(`  描述: ${desc}`);
  }

  if (flags & 0x00000008) {
    const charCount = readU16LE(bytes, offset);
    offset += 2;
    const relPath = isUnicode ? readWString(bytes, offset, charCount) : readCString(bytes, offset, charCount);
    offset += isUnicode ? charCount * 2 : charCount;
    L.push(`  相对路径: ${relPath}`);
  }

  if (flags & 0x00000010) {
    const charCount = readU16LE(bytes, offset);
    offset += 2;
    const workDir = isUnicode ? readWString(bytes, offset, charCount) : readCString(bytes, offset, charCount);
    offset += isUnicode ? charCount * 2 : charCount;
    L.push(`  工作目录: ${workDir}`);
  }

  if (flags & 0x00000020) {
    const charCount = readU16LE(bytes, offset);
    offset += 2;
    const args = isUnicode ? readWString(bytes, offset, charCount) : readCString(bytes, offset, charCount);
    offset += isUnicode ? charCount * 2 : charCount;
    L.push(`  参数: ${args}`);
  }

  if (flags & 0x00000040) {
    const charCount = readU16LE(bytes, offset);
    offset += 2;
    const iconLoc = isUnicode ? readWString(bytes, offset, charCount) : readCString(bytes, offset, charCount);
    offset += isUnicode ? charCount * 2 : charCount;
    L.push(`  图标位置: ${iconLoc}`);
  }

  if (!(flags & 0x00000004) && !(flags & 0x00000008) && !(flags & 0x00000010) &&
      !(flags & 0x00000020) && !(flags & 0x00000040)) {
    L.push('  (无 StringData)');
  }
  L.push('');

  L.push('── ExtraData ──');
  let blockCount = 0;
  let machineName = '';
  let envTargetPath = '';

  while (offset + 8 <= bytes.length) {
    const blockSize = readU32LE(bytes, offset) >>> 0;
    const blockSig = readU32LE(bytes, offset + 4) >>> 0;
    if (blockSize < 8 || offset + blockSize > bytes.length) break;

    if (blockSig === 0xA0000003 && offset + 0x20 < bytes.length) {
      machineName = readCString(bytes, offset + 0x10, 16).replace(/\0+$/, '');
    }
    if (blockSig === 0xA0000001 && offset + 0x10C + 2 < bytes.length) {
      envTargetPath = readWString(bytes, offset + 0x10C, 260);
    }

    blockCount++;
    offset += blockSize;
  }

  if (machineName) L.push(`  机器名: ${machineName}`);
  if (envTargetPath) L.push(`  环境目标路径: ${envTargetPath}`);
  if (blockCount > 0) {
    L.push(`  ExtraData 块数量: ${blockCount}`);
  } else {
    L.push('  (无 ExtraData 块)');
  }

  return L.join('\n');
};

const ToolComponent = (props: ToolProps) => (
  <AsyncTool {...props} toolName="LNK快捷方式解析"
    execute={async (input: string, _mode: string, _params: Record<string, unknown>, file: File | null) => {
      let hex = input;
      if (file) {
        hex = await readFileAsHex(file, 128 * 1024);
        const noteIdx = hex.indexOf('\n');
        if (noteIdx >= 0) hex = hex.substring(0, noteIdx);
      }
      const bytes = parseHex(hex);
      return parse(bytes);
    }} />
);
export default ToolComponent;
