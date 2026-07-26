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

interface BOMInfo {
  name: string;
  bom: number[];
  encoding: string;
}

const BOM_LIST: BOMInfo[] = [
  { name: 'UTF-8 BOM', bom: [0xef, 0xbb, 0xbf], encoding: 'UTF-8' },
  { name: 'UTF-16 LE BOM', bom: [0xff, 0xfe], encoding: 'UTF-16LE' },
  { name: 'UTF-16 BE BOM', bom: [0xfe, 0xff], encoding: 'UTF-16BE' },
  { name: 'UTF-32 LE BOM', bom: [0xff, 0xfe, 0x00, 0x00], encoding: 'UTF-32LE' },
  { name: 'UTF-32 BE BOM', bom: [0x00, 0x00, 0xfe, 0xff], encoding: 'UTF-32BE' },
];

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      const bytes = hexToBytes(input);
      if (bytes.length === 0) throw new Error('输入为空');
      const lines: string[] = [
        `总字节数: ${bytes.length}`,
        `前 4 字节: ${bytes.slice(0, 4).map((b: number) => b.toString(16).padStart(2, '0')).join(' ')}`,
        '',
      ];
      const matchedBOM = BOM_LIST.find((bom: BOMInfo) => {
        if (bytes.length < bom.bom.length) return false;
        return bom.bom.every((b: number, i: number) => bytes[i] === b);
      });
      if (matchedBOM) {
        lines.push(`✓ 检测到 BOM: ${matchedBOM.name}`);
        lines.push(`  编码: ${matchedBOM.encoding}`);
        const bomLen = matchedBOM.bom.length;
        lines.push(`  BOM 长度: ${bomLen} bytes`);
        const dataBytes = bytes.slice(bomLen);
        try {
          const decoded = new TextDecoder(matchedBOM.encoding.toLowerCase()).decode(new Uint8Array(dataBytes));
          const preview = decoded.length > 100 ? decoded.slice(0, 100) + '...' : decoded;
          lines.push(`  解码预览: ${preview}`);
        } catch {
          lines.push('  解码失败');
        }
      } else {
        lines.push('未检测到 BOM');
        lines.push('');
        lines.push('=== 启发式分析 ===');
        let asciiCount = 0;
        let nullCount = 0;
        let highByteCount = 0;
        let evenNulls = 0;
        let oddNulls = 0;
        for (let i = 0; i < bytes.length; i++) {
          const b = bytes[i];
          if (b === 0x00) {
            nullCount++;
            if (i % 2 === 0) evenNulls++;
            else oddNulls++;
          }
          if (b >= 0x20 && b <= 0x7e) asciiCount++;
          if (b >= 0x80) highByteCount++;
        }
        const asciiRatio = (asciiCount / bytes.length) * 100;
        const highRatio = (highByteCount / bytes.length) * 100;
        lines.push(`ASCII 可打印字符: ${asciiCount} (${asciiRatio.toFixed(1)}%)`);
        lines.push(`高位字节 (>=0x80): ${highByteCount} (${highRatio.toFixed(1)}%)`);
        lines.push(`零字节: ${nullCount}`);
        if (nullCount > 0) {
          lines.push(`  偶数位置零字节: ${evenNulls}`);
          lines.push(`  奇数位置零字节: ${oddNulls}`);
        }
        lines.push('');
        if (asciiRatio > 90) {
          lines.push('推测编码: ASCII / UTF-8 (无 BOM)');
        } else if (nullCount > 0 && evenNulls > oddNulls * 2) {
          lines.push('推测编码: UTF-16LE (偶数位置零字节多)');
        } else if (nullCount > 0 && oddNulls > evenNulls * 2) {
          lines.push('推测编码: UTF-16BE (奇数位置零字节多)');
        } else if (highRatio > 50) {
          lines.push('推测编码: 可能是 UTF-8 多字节或二进制数据');
        } else {
          lines.push('推测编码: 可能是 UTF-8 (无 BOM) 或混合编码');
        }
      }
      return lines.join('\n');
    }}
  />
);
export default ToolComponent;
