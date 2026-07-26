import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const hexToBytes = (hex: string): number[] => {
  const cleaned = hex.replace(/\s/g, '').toLowerCase();
  const result: number[] = [];
  for (let i = 0; i < cleaned.length; i += 2) {
    result.push(parseInt(cleaned.slice(i, i + 2), 16));
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
      if (!input.trim()) return '请输入 BMP 文件的十六进制数据';
      const cleaned = input.replace(/\s/g, '').toLowerCase();
      if (cleaned.length % 2 !== 0) return '十六进制长度必须为偶数，请检查输入';
      if (!/^[0-9a-f]*$/.test(cleaned)) return '包含非十六进制字符，请检查输入';
      const bytes = hexToBytes(input);
      if (bytes.length < 54) return 'BMP 文件头至少需要 54 字节，当前 ' + bytes.length + ' 字节';
      if (bytes[0] !== 0x42 || bytes[1] !== 0x4d) {
        return '⚠️ 不是有效的 BMP 文件（签名 424D 不匹配）';
      }
      const fileSize = readUInt32LE(bytes, 2);
      const dataOffset = readUInt32LE(bytes, 10);
      const headerSize = readUInt32LE(bytes, 14);
      const width = readUInt32LE(bytes, 18);
      const height = readUInt32LE(bytes, 22);
      const planes = readUInt16LE(bytes, 26);
      const bpp = readUInt16LE(bytes, 28);
      const compression = readUInt32LE(bytes, 30);
      const imageDataSize = readUInt32LE(bytes, 34);
      const compNames: Record<number, string> = {
        0: 'BI_RGB (无压缩)',
        1: 'BI_RLE8',
        2: 'BI_RLE4',
        3: 'BI_BITFIELDS',
      };
      const lines: string[] = [
        '✓ BMP 签名验证通过',
        '',
        '文件头 (BITMAPFILEHEADER):',
        `  签名: BM (42 4d)`,
        `  文件大小: ${fileSize} bytes`,
        `  数据偏移: ${dataOffset} (0x${dataOffset.toString(16)})`,
        '',
        '信息头 (BITMAPINFOHEADER):',
        `  头大小: ${headerSize} bytes`,
        `  宽度: ${width}px`,
        `  高度: ${Math.abs(height)}px (${height < 0 ? '自下而上' : '自上而下'})`,
        `  颜色平面数: ${planes}`,
        `  位深: ${bpp} bits`,
        `  压缩方式: ${compression} (${compNames[compression] ?? 'Unknown'})`,
        `  图像数据大小: ${imageDataSize} bytes`,
      ];
      return lines.join('\n');
    }}
  />
);
export default ToolComponent;
