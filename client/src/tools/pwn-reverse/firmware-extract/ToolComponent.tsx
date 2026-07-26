import AsyncTool from '../../_shared/AsyncTool';
import { readFileAsHex } from '../../_shared/inputUtils';
import { parseHex, readU32LE, readU16LE } from '../../_shared/hexUtils';
import type { ToolProps } from '../../types';

/* ---------- helpers ---------- */

const stripReaderMsg = (hex: string): string => {
  const idx = hex.indexOf('\n\n(');
  return idx >= 0 ? hex.substring(0, idx) : hex;
};

interface ScanItem {
  type: string;
  offset: number;
  size?: number;
  note?: string;
  children?: ScanItem[];
}

interface MagicSignature {
  type: string;
  note?: string;
  patterns: { bytes: number[]; offset?: number; note?: string }[];
}

const MAGIC_SIGNATURES: MagicSignature[] = [
  {
    type: 'gzip',
    patterns: [{ bytes: [0x1f, 0x8b] }],
    note: 'Gzip 压缩数据',
  },
  {
    type: 'zlib',
    patterns: [
      { bytes: [0x78, 0x01] },
      { bytes: [0x78, 0x5e] },
      { bytes: [0x78, 0x9c] },
      { bytes: [0x78, 0xda] },
    ],
    note: 'Zlib 压缩数据',
  },
  {
    type: 'xz',
    patterns: [{ bytes: [0xfd, 0x37, 0x7a, 0x58, 0x5a, 0x00] }],
    note: 'XZ 压缩数据',
  },
  {
    type: 'squashfs',
    patterns: [
      { bytes: [0x68, 0x73, 0x71, 0x73], note: 'SquashFS (LE)' },
      { bytes: [0x73, 0x71, 0x73, 0x68], note: 'SquashFS (BE)' },
    ],
    note: 'SquashFS 文件系统',
  },
  {
    type: 'jffs2',
    patterns: [
      { bytes: [0x19, 0x85], note: 'JFFS2 (旧)' },
      { bytes: [0x85, 0x19], note: 'JFFS2 (新)' },
    ],
    note: 'JFFS2 文件系统',
  },
  {
    type: 'cramfs',
    patterns: [
      { bytes: [0x45, 0x3d, 0xcd, 0x28], note: 'CRAMFS (LE)' },
      { bytes: [0x28, 0xcd, 0x3d, 0x45], note: 'CRAMFS (BE)' },
    ],
    note: 'CRAMFS 文件系统',
  },
  {
    type: 'ext',
    patterns: [{ bytes: [0x53, 0xef], offset: 0x438 }],
    note: 'EXT2/3/4 文件系统',
  },
  {
    type: 'ubi',
    patterns: [{ bytes: [0x55, 0x42, 0x49, 0x23] }],
    note: 'UBI 镜像',
  },
  {
    type: 'ubifs',
    patterns: [{ bytes: [0x31, 0x18, 0x75, 0x19] }],
    note: 'UBIFS 文件系统',
  },
  {
    type: 'cpio',
    patterns: [
      { bytes: [0x30, 0x37, 0x30, 0x37], note: 'New ASCII CPIO' },
    ],
    note: 'CPIO 归档',
  },
  {
    type: 'tar',
    patterns: [{ bytes: [0x75, 0x73, 0x74, 0x61, 0x72], offset: 0x101 }],
    note: 'TAR 归档',
  },
  {
    type: 'pe',
    patterns: [{ bytes: [0x4d, 0x5a] }],
    note: 'PE 可执行文件',
  },
  {
    type: 'elf',
    patterns: [{ bytes: [0x7f, 0x45, 0x4c, 0x46] }],
    note: 'ELF 可执行文件',
  },
  {
    type: 'upx',
    patterns: [{ bytes: [0x55, 0x50, 0x58, 0x21] }],
    note: 'UPX 壳',
  },
];

const decompress = async (
  data: Uint8Array,
  format: 'gzip' | 'deflate' | 'deflate-raw',
): Promise<Uint8Array> => {
  const ds = new DecompressionStream(format);
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

const findPattern = (bytes: Uint8Array, pattern: number[], startOffset: number): number => {
  for (let i = startOffset; i <= bytes.length - pattern.length; i++) {
    let found = true;
    for (let j = 0; j < pattern.length; j++) {
      if (bytes[i + j] !== pattern[j]) {
        found = false;
        break;
      }
    }
    if (found) return i;
  }
  return -1;
};

const detectMagic = (bytes: Uint8Array): ScanItem[] => {
  const found: ScanItem[] = [];
  const seen: Set<string> = new Set();
  for (const sig of MAGIC_SIGNATURES) {
    for (const pat of sig.patterns) {
      const base: number = pat.offset ?? 0;
      let off: number = findPattern(bytes, pat.bytes, base);
      while (off >= 0) {
        const key = `${sig.type}@${off}`;
        if (!seen.has(key)) {
          seen.add(key);
          found.push({
            type: sig.type,
            offset: off,
            note: pat.note ?? sig.note,
          });
        }
        off = findPattern(bytes, pat.bytes, off + Math.max(pat.bytes.length, 1));
      }
    }
  }
  found.sort((a: ScanItem, b: ScanItem) => a.offset - b.offset);
  return found;
};

const tryDecompress = async (data: Uint8Array, type: string): Promise<Uint8Array | null> => {
  const formats: { type: string; format: 'gzip' | 'deflate' | 'deflate-raw' }[] = [
    { type: 'gzip', format: 'gzip' },
    { type: 'zlib', format: 'deflate' },
  ];
  const fmt = formats.find((f) => f.type === type);
  if (!fmt) return null;
  try {
    return await decompress(data, fmt.format);
  } catch {
    return null;
  }
};

const scanRecursive = async (
  bytes: Uint8Array,
  depth: number,
  maxDepth: number,
  maxDecompressedBytes: number,
): Promise<ScanItem[]> => {
  if (depth > maxDepth) return [];
  const found = detectMagic(bytes);
  const results: ScanItem[] = [];
  for (const item of found) {
    const compressed = item.type === 'gzip' || item.type === 'zlib';
    if (compressed && depth < maxDepth) {
      let dataLen = bytes.length - item.offset;
      // Heuristic: try first 64KB; gzip can self-terminate.
      dataLen = Math.min(dataLen, 64 * 1024);
      const slice = bytes.subarray(item.offset, item.offset + dataLen);
      const decompressed = await tryDecompress(slice, item.type);
      if (decompressed && decompressed.length > 0 && decompressed.length <= maxDecompressedBytes) {
        item.size = decompressed.length;
        item.children = await scanRecursive(
          decompressed,
          depth + 1,
          maxDepth,
          maxDecompressedBytes,
        );
      }
    }
    results.push(item);
  }
  return results;
};

const formatItem = (item: ScanItem, prefix: string): string[] => {
  const lines: string[] = [];
  const sizeStr = item.size !== undefined ? ` [${item.size} 字节]` : '';
  lines.push(
    `${prefix}[0x${item.offset.toString(16).padStart(8, '0')}] ${item.type}${sizeStr} ${item.note ?? ''}`,
  );
  if (item.children && item.children.length > 0) {
    item.children.forEach((child: ScanItem, idx: number, arr: ScanItem[]) => {
      const isLast = idx === arr.length - 1;
      const childPrefix = `${prefix}${isLast ? '└─ ' : '├─ '}`;
      lines.push(...formatItem(child, childPrefix));
    });
  }
  return lines;
};

const getEmbeddedFileTypes = (items: ScanItem[]): { type: string; count: number }[] => {
  const counts: Record<string, number> = {};
  const visit = (list: ScanItem[]) => {
    for (const item of list) {
      counts[item.type] = (counts[item.type] ?? 0) + 1;
      if (item.children) visit(item.children);
    }
  };
  visit(items);
  return Object.entries(counts)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);
};

const analyzeFirmware = async (bytes: Uint8Array): Promise<string> => {
  const L: string[] = [];
  L.push('═══════════════════════════════════════════');
  L.push('  固件提取分析报告');
  L.push('═══════════════════════════════════════════');
  L.push('');
  L.push('── 扫描信息 ──');
  L.push(`  输入大小:  ${bytes.length} 字节`);
  L.push('  最大递归深度: 3');
  L.push('  解压上限: 8 MB / 层');
  L.push('');

  const items = await scanRecursive(bytes, 0, 3, 8 * 1024 * 1024);

  L.push('── 文件系统结构 ──');
  if (items.length === 0) {
    L.push('  未识别到已知文件系统或压缩层。');
  } else {
    for (const item of items) {
      L.push(...formatItem(item, '  '));
    }
  }
  L.push('');

  L.push('── 识别到的类型统计 ──');
  const stats = getEmbeddedFileTypes(items);
  if (stats.length === 0) {
    L.push('  无');
  } else {
    stats.forEach(({ type, count }) => {
      L.push(`  ${type}: ${count} 处`);
    });
  }
  L.push('');

  L.push('── 提取建议 ──');
  const filesystems = items.filter((i: ScanItem) =>
    ['squashfs', 'jffs2', 'cramfs', 'ext', 'ubi', 'ubifs', 'cpio', 'tar'].includes(i.type),
  );
  const compressions = items.filter((i: ScanItem) =>
    ['gzip', 'zlib', 'xz'].includes(i.type),
  );
  if (filesystems.length > 0) {
    L.push('  检测到文件系统，建议使用 binwalk / 7z / unsquashfs 等专业工具进一步提取。');
  }
  if (compressions.length > 0) {
    L.push('  检测到压缩层，已尝试使用浏览器 DecompressionStream 自动解压并递归扫描。');
    L.push('  对于 LZMA/XZ 等未自动解压的格式，请下载后用 binwalk 分析。');
  }
  if (filesystems.length === 0 && compressions.length === 0) {
    L.push('  未识别到可处理的文件系统或压缩层。');
  }

  return L.join('\n');
};

/* ---------- Component ---------- */

const ToolComponent = (props: ToolProps) => (
  <AsyncTool
    {...props}
    toolName="固件提取"
    execute={async (
      input: string,
      _mode: string,
      _params: Record<string, unknown>,
      file: File | null,
    ) => {
      let hexData = input;
      if (file) {
        hexData = await readFileAsHex(file, 4 * 1024 * 1024);
      }
      const hexOnly: string = stripReaderMsg(hexData);
      const bytes: Uint8Array = parseHex(hexOnly);
      return analyzeFirmware(bytes);
    }}
  />
);
export default ToolComponent;
