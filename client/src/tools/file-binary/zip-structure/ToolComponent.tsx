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

const readUInt16LE = (bytes: number[], offset: number): number =>
  (bytes[offset + 1] << 8) | bytes[offset];

const readUInt32LE = (bytes: number[], offset: number): number =>
  (bytes[offset + 3] << 24) |
  (bytes[offset + 2] << 16) |
  (bytes[offset + 1] << 8) |
  bytes[offset];

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      const bytes = hexToBytes(input);
      if (bytes.length < 4) throw new Error('数据过短');
      if (bytes[0] !== 0x50 || bytes[1] !== 0x4b) {
        return '⚠️ 不是有效的 ZIP 文件（签名 504B 不匹配）';
      }
      const lines: string[] = ['✓ ZIP 签名验证通过', ''];
      let offset = 0;
      let entryCount = 0;
      while (offset + 4 <= bytes.length) {
        const sig = readUInt32LE(bytes, offset);
        if (sig === 0x04034b50) {
          if (offset + 30 > bytes.length) break;
          entryCount++;
          const compression = readUInt16LE(bytes, offset + 8);
          const compressedSize = readUInt32LE(bytes, offset + 18);
          const uncompressedSize = readUInt32LE(bytes, offset + 22);
          const nameLen = readUInt16LE(bytes, offset + 26);
          const extraLen = readUInt16LE(bytes, offset + 28);
          const nameStart = offset + 30;
          const nameEnd = nameStart + nameLen;
          const name = nameEnd <= bytes.length
            ? bytes.slice(nameStart, nameEnd).map((b: number) => String.fromCharCode(b)).join('')
            : '(无法读取)';
          const compName = compression === 0 ? 'Stored' : compression === 8 ? 'Deflate' : `Method ${compression}`;
          lines.push(`Entry ${entryCount}: ${name}`);
          lines.push(`  压缩方式: ${compName}`);
          lines.push(`  压缩大小: ${compressedSize} bytes`);
          lines.push(`  原始大小: ${uncompressedSize} bytes`);
          lines.push('');
          offset = nameEnd + extraLen + compressedSize;
        } else if (sig === 0x02014b50) {
          lines.push('--- Central Directory ---');
          break;
        } else if (sig === 0x06054b50) {
          lines.push('--- End of Central Directory ---');
          break;
        } else {
          break;
        }
      }
      lines.push(`共找到 ${entryCount} 个文件条目`);
      return lines.join('\n');
    }}
  />
);
export default ToolComponent;
