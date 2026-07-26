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

const MARKER_NAMES: Record<number, string> = {
  0xd8: 'SOI (Start of Image)',
  0xd9: 'EOI (End of Image)',
  0xda: 'SOS (Start of Scan)',
  0xdb: 'DQT (Define Quantization Table)',
  0xc0: 'SOF0 (Baseline DCT)',
  0xc2: 'SOF2 (Progressive DCT)',
  0xc4: 'DHT (Define Huffman Table)',
  0xe0: 'APP0 (JFIF)',
  0xe1: 'APP1 (Exif/XMP)',
  0xe2: 'APP2',
  0xfe: 'COM (Comment)',
  0xdd: 'DRI (Define Restart Interval)',
  0xed: 'APP13 (Photoshop)',
  0xee: 'APP14 (Adobe)',
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      const bytes = hexToBytes(input);
      if (bytes.length < 2) throw new Error('数据过短');
      if (bytes[0] !== 0xff || bytes[1] !== 0xd8) {
        return '⚠️ 不是有效的 JPEG 文件（签名 FFD8 不匹配）';
      }
      const lines: string[] = ['✓ JPEG SOI 验证通过', ''];
      let offset = 2;
      while (offset + 1 < bytes.length) {
        if (bytes[offset] !== 0xff) {
          offset++;
          continue;
        }
        const marker = bytes[offset + 1];
        if (marker === 0xff) {
          offset++;
          continue;
        }
        const name = MARKER_NAMES[marker] ?? `0xFF${marker.toString(16).padStart(2, '0')}`;
        lines.push(`Marker: FF${marker.toString(16).padStart(2, '0')} — ${name}`);
        lines.push(`  偏移: 0x${offset.toString(16)}`);
        if (marker === 0xd9 || marker === 0xda) {
          if (marker === 0xd9) {
            lines.push('  (文件结束)');
            break;
          }
          lines.push('  (扫描数据开始，后续为压缩数据)');
          break;
        }
        if (offset + 3 < bytes.length) {
          const segLen = (bytes[offset + 2] << 8) | bytes[offset + 3];
          lines.push(`  段长度: ${segLen}`);
          if (marker === 0xc0 || marker === 0xc2) {
            if (offset + 9 < bytes.length) {
              const precision = bytes[offset + 4];
              const h = (bytes[offset + 5] << 8) | bytes[offset + 6];
              const w = (bytes[offset + 7] << 8) | bytes[offset + 8];
              lines.push(`  精度: ${precision} bits`);
              lines.push(`  高度: ${h}px`);
              lines.push(`  宽度: ${w}px`);
            }
          }
          offset += 2 + segLen;
        } else {
          break;
        }
      }
      return lines.join('\n');
    }}
  />
);
export default ToolComponent;
