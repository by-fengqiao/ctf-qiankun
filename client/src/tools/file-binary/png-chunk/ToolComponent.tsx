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

const readUInt32BE = (bytes: number[], offset: number): number => {
  return (
    ((bytes[offset] << 24) |
    (bytes[offset + 1] << 16) |
    (bytes[offset + 2] << 8) |
    bytes[offset + 3]) >>> 0
  );
};

// Table-driven CRC32 (polynomial 0xEDB88320)
const crcTable: number[] = (() => {
  const table: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c >>> 0;
  }
  return table;
})();

const crc32 = (bytes: number[], start: number, length: number): number => {
  let crc = 0xFFFFFFFF;
  for (let i = start; i < start + length; i++) {
    crc = crcTable[(crc ^ bytes[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      const bytes = hexToBytes(input);
      if (bytes.length < 8) throw new Error('数据过短');
      const sig = bytes.slice(0, 8);
      const expectedSig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
      const isPng = sig.every((b: number, i: number) => b === expectedSig[i]);
      if (!isPng) {
        return '⚠️ 不是有效的 PNG 文件（签名不匹配）\nPNG 签名: 89 50 4e 47 0d 0a 1a 0a';
      }
      const lines: string[] = ['✓ PNG 签名验证通过', ''];
      let offset = 8;
      while (offset + 8 <= bytes.length) {
        const length = readUInt32BE(bytes, offset);
        const typeBytes = bytes.slice(offset + 4, offset + 8);
        const type = String.fromCharCode(...typeBytes);
        if (!/^[A-Za-z]{4}$/.test(type)) break;
        lines.push(`Chunk: ${type}`);
        lines.push(`  偏移: 0x${offset.toString(16)}`);
        lines.push(`  长度: ${length} bytes`);
        const dataStart = offset + 8;
        // CRC32 校验: 对 type + data 计算
        if (dataStart + length + 4 <= bytes.length) {
          const computedCrc = crc32(bytes, offset + 4, 4 + length);
          const storedCrc = readUInt32BE(bytes, dataStart + length);
          const crcOk = computedCrc === storedCrc;
          lines.push(`  CRC32: ${crcOk ? '✓' : '✗'} (计算=0x${computedCrc.toString(16).toUpperCase().padStart(8, '0')}, 存储=0x${storedCrc.toString(16).toUpperCase().padStart(8, '0')})`);
        }
        if (type === 'IHDR' && dataStart + 13 <= bytes.length) {
          const w = readUInt32BE(bytes, dataStart);
          const h = readUInt32BE(bytes, dataStart + 4);
          const bd = bytes[dataStart + 8];
          const ct = bytes[dataStart + 9];
          lines.push(`  宽度: ${w}px`);
          lines.push(`  高度: ${h}px`);
          lines.push(`  位深: ${bd}`);
          lines.push(`  颜色类型: ${ct}`);
        }
        offset += 12 + length;
        if (type === 'IEND') {
          lines.push('  (文件结束)');
          break;
        }
      }
      return lines.join('\n');
    }}
  />
);
export default ToolComponent;
