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

const readUInt16BE = (bytes: number[], offset: number): number =>
  (bytes[offset] << 8) | bytes[offset + 1];

const readUInt32LE = (bytes: number[], offset: number): number =>
  bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24);

const readUInt32BE = (bytes: number[], offset: number): number =>
  (bytes[offset] << 24) |
  (bytes[offset + 1] << 16) |
  (bytes[offset + 2] << 8) |
  bytes[offset + 3];

const readUInt16LE = (bytes: number[], offset: number): number =>
  (bytes[offset + 1] << 8) | bytes[offset];

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      const bytes = hexToBytes(input);
      if (bytes.length < 8) throw new Error('数据过短，至少需要 8 字节');
      if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
        if (bytes.length < 24) throw new Error('PNG 数据过短');
        const w = readUInt32BE(bytes, 16);
        const h = readUInt32BE(bytes, 20);
        const bd = bytes[24] ?? 0;
        const ct = bytes[25] ?? 0;
        return `格式: PNG\n宽度: ${w}px\n高度: ${h}px\n位深: ${bd}\n颜色类型: ${ct}`;
      }
      if (bytes[0] === 0xff && bytes[1] === 0xd8) {
        let offset = 2;
        while (offset + 1 < bytes.length) {
          if (bytes[offset] !== 0xff) {
            offset++;
            continue;
          }
          const marker = bytes[offset + 1];
          if (
            (marker >= 0xc0 && marker <= 0xc3) ||
            (marker >= 0xc5 && marker <= 0xc7) ||
            (marker >= 0xc9 && marker <= 0xcb) ||
            (marker >= 0xcd && marker <= 0xcf)
          ) {
            if (offset + 9 >= bytes.length) throw new Error('JPEG SOF 段数据过短');
            const h = readUInt16BE(bytes, offset + 5);
            const w = readUInt16BE(bytes, offset + 7);
            const precision = bytes[offset + 4];
            return `格式: JPEG\n宽度: ${w}px\n高度: ${h}px\n精度: ${precision} bits`;
          }
          if (marker === 0xd9 || marker === 0xda) break;
          if (offset + 3 < bytes.length) {
            const segLen = readUInt16BE(bytes, offset + 2);
            offset += 2 + segLen;
          } else {
            break;
          }
        }
        return '格式: JPEG\n⚠️ 未找到 SOF 标记，无法获取尺寸';
      }
      if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
        if (bytes.length < 10) throw new Error('GIF 数据过短');
        const w = readUInt16LE(bytes, 6);
        const h = readUInt16LE(bytes, 8);
        const ver = String.fromCharCode(bytes[3], bytes[4], bytes[5]);
        return `格式: GIF${ver}\n宽度: ${w}px\n高度: ${h}px`;
      }
      if (bytes[0] === 0x42 && bytes[1] === 0x4d) {
        if (bytes.length < 26) throw new Error('BMP 数据过短');
        const w = readUInt32LE(bytes, 18);
        const h = readUInt32LE(bytes, 22);
        const bpp = readUInt16LE(bytes, 28);
        return `格式: BMP\n宽度: ${Math.abs(w)}px\n高度: ${Math.abs(h)}px (${h < 0 ? '自下而上' : '自上而下'})\n位深: ${bpp}`;
      }
      return '⚠️ 无法识别的图片格式\n支持: PNG (89504e47), JPEG (ffd8), GIF (474946), BMP (424d)';
    }}
  />
);
export default ToolComponent;
