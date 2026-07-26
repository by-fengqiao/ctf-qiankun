import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const hexToBytes = (hex: string): number[] => {
  const cleaned = hex.replace(/\s/g, '').toLowerCase();
  if (cleaned.length === 0) return [];
  if (cleaned.length % 2 !== 0) throw new Error('Hex 长度必须为偶数');
  const result: number[] = [];
  for (let i = 0; i < cleaned.length; i += 2) {
    const byte = parseInt(cleaned.slice(i, i + 2), 16);
    if (isNaN(byte)) throw new Error(`无效的 Hex 值: ${cleaned.slice(i, i + 2)}`);
    result.push(byte);
  }
  return result;
};

interface CompressionFormat {
  name: string;
  extension: string;
  check: (bytes: number[]) => boolean;
  description: string;
}

const FORMATS: CompressionFormat[] = [
  {
    name: 'GZIP',
    extension: '.gz',
    check: (b) => b.length >= 2 && b[0] === 0x1f && b[1] === 0x8b,
    description: '魔数: 1F 8B，使用 Deflate 算法',
  },
  {
    name: 'Zlib (Deflate)',
    extension: '.z',
    check: (b) => b.length >= 2 && b[0] === 0x78 && (b[1] === 0x01 || b[1] === 0x5e || b[1] === 0x9c || b[1] === 0xda),
    description: '魔数: 78 01/5e/9c/da，zlib 包装的 Deflate',
  },
  {
    name: 'BZIP2',
    extension: '.bz2',
    check: (b) => b.length >= 3 && b[0] === 0x42 && b[1] === 0x5a && b[2] === 0x68,
    description: '魔数: 42 5A 68 ("BZh")，Burrows-Wheeler 块排序压缩',
  },
  {
    name: 'XZ',
    extension: '.xz',
    check: (b) => b.length >= 6 && b[0] === 0xfd && b[1] === 0x37 && b[2] === 0x7a && b[3] === 0x58 && b[4] === 0x5a && b[5] === 0x00,
    description: '魔数: FD 37 7A 58 5A 00，LZMA2 压缩',
  },
  {
    name: 'ZIP',
    extension: '.zip',
    check: (b) => b.length >= 4 && b[0] === 0x50 && b[1] === 0x4b && (b[2] === 0x03 || b[2] === 0x05 || b[2] === 0x07),
    description: '魔数: 50 4B 03/05/07，PKZIP 归档',
  },
  {
    name: '7z',
    extension: '.7z',
    check: (b) => b.length >= 6 && b[0] === 0x37 && b[1] === 0x7a && b[2] === 0xbc && b[3] === 0xaf && b[4] === 0x27 && b[5] === 0x1c,
    description: '魔数: 37 7A BC AF 27 1C，7-Zip 归档',
  },
  {
    name: 'RAR',
    extension: '.rar',
    check: (b) => b.length >= 4 && b[0] === 0x52 && b[1] === 0x61 && b[2] === 0x72 && b[3] === 0x21,
    description: '魔数: 52 61 72 21 ("Rar!")，RAR 归档',
  },
  {
    name: 'LZ4',
    extension: '.lz4',
    check: (b) => b.length >= 4 && b[0] === 0x04 && b[1] === 0x22 && b[2] === 0x4d && b[3] === 0x18,
    description: '魔数: 04 22 4D 18，LZ4 压缩',
  },
  {
    name: 'LZMA (raw)',
    extension: '.lzma',
    check: (b) => b.length >= 1 && b[0] === 0x5d,
    description: '可能的 LZMA 流（魔数 5D，非确定性判断）',
  },
];

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      const bytes = hexToBytes(input);
      if (bytes.length === 0) throw new Error('输入为空');
      const magicHex = bytes.slice(0, 8).map((b: number) => b.toString(16).padStart(2, '0')).join(' ');
      const lines: string[] = [
        `前 8 字节: ${magicHex}`,
        `总大小: ${bytes.length} bytes`,
        '',
      ];
      const matched = FORMATS.filter((f) => f.check(bytes));
      if (matched.length > 0) {
        lines.push('✓ 检测到压缩格式:');
        for (const f of matched) {
          lines.push(`  ${f.name} (${f.extension})`);
          lines.push(`    ${f.description}`);
        }
      } else {
        lines.push('⚠️ 未检测到已知压缩格式');
        lines.push('');
        lines.push('已检查的格式:');
        for (const f of FORMATS) {
          lines.push(`  ${f.name} — ${f.description}`);
        }
      }
      return lines.join('\n');
    }}
  />
);
export default ToolComponent;
