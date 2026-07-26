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

const readUInt16LE = (bytes: number[], offset: number): number => {
  return (bytes[offset + 1] << 8) | bytes[offset];
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      const bytes = hexToBytes(input);
      if (bytes.length < 6) throw new Error('数据过短');
      const sig = String.fromCharCode(bytes[0], bytes[1], bytes[2]);
      if (sig !== 'GIF') {
        return '⚠️ 不是有效的 GIF 文件（签名 GIF 不匹配）';
      }
      const ver = String.fromCharCode(bytes[3], bytes[4], bytes[5]);
      const lines: string[] = [
        '✓ GIF 签名验证通过',
        `版本: GIF${ver}`,
      ];
      if (bytes.length >= 10) {
        const width = readUInt16LE(bytes, 6);
        const height = readUInt16LE(bytes, 8);
        const packed = bytes[10];
        const hasGCT = (packed & 0x80) !== 0;
        const gctSize = hasGCT ? 3 * (2 << (packed & 0x07)) : 0;
        const bgColor = bytes[11];
        const aspectRatio = bytes[12];
        lines.push('');
        lines.push('逻辑屏幕描述符:');
        lines.push(`  宽度: ${width}px`);
        lines.push(`  高度: ${height}px`);
        lines.push(`  全局颜色表: ${hasGCT ? '是' : '否'}`);
        if (hasGCT) {
          lines.push(`  颜色表大小: ${gctSize} bytes (${1 << ((packed & 0x07) + 1)} 色)`);
        }
        lines.push(`  背景色索引: ${bgColor}`);
        lines.push(`  像素宽高比: ${aspectRatio === 0 ? '1:1' : `${(aspectRatio + 15) / 64}:1`}`);
      }
      let offset = 13;
      if (bytes.length >= 10 && (bytes[10] & 0x80) !== 0) {
        const gctSize = 3 * (2 << (bytes[10] & 0x07));
        offset += gctSize;
      }
      let frameCount = 0;
      while (offset < bytes.length - 1) {
        if (bytes[offset] === 0x2c) {
          frameCount++;
          if (bytes.length >= offset + 10) {
            const left = readUInt16LE(bytes, offset + 1);
            const top = readUInt16LE(bytes, offset + 3);
            const w = readUInt16LE(bytes, offset + 5);
            const h = readUInt16LE(bytes, offset + 7);
            lines.push('');
            lines.push(`帧 ${frameCount} (图像描述符):`);
            lines.push(`  位置: (${left}, ${top})`);
            lines.push(`  尺寸: ${w} x ${h}px`);
          }
          break;
        }
        if (bytes[offset] === 0x21 && bytes[offset + 1] === 0xf9) {
          lines.push('');
          lines.push('图形控制扩展:');
          if (bytes.length >= offset + 7) {
            const delay = readUInt16LE(bytes, offset + 4);
            lines.push(`  延迟: ${delay * 10}ms`);
          }
          offset += 8;
          continue;
        }
        if (bytes[offset] === 0x3b) {
          lines.push('\n(GIF 结束标记 0x3B)');
          break;
        }
        offset++;
      }
      if (frameCount > 0) {
        lines.push(`\n共找到 ${frameCount} 个图像帧`);
      }
      return lines.join('\n');
    }}
  />
);
export default ToolComponent;
