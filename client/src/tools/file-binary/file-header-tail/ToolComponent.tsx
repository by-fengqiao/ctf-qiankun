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

const formatHexLine = (bytes: number[], startOffset: number): string => {
  const hexPart = bytes
    .map((b: number) => b.toString(16).padStart(2, '0'))
    .join(' ');
  const asciiPart = bytes
    .map((b: number) => (b >= 0x20 && b <= 0x7e ? String.fromCharCode(b) : '.'))
    .join('');
  return `${startOffset.toString(16).padStart(8, '0')}  ${hexPart}  |${asciiPart}|`;
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      const bytes = hexToBytes(input);
      if (bytes.length === 0) throw new Error('输入为空');
      const headSize = Math.min(32, bytes.length);
      const tailSize = Math.min(32, bytes.length);
      const head = bytes.slice(0, headSize);
      const tailStart = Math.max(0, bytes.length - tailSize);
      const tail = bytes.slice(tailStart);
      const lines: string[] = [
        `文件总大小: ${bytes.length} bytes`,
        '',
        `=== 文件头 (前 ${headSize} 字节) ===`,
        formatHexLine(head, 0),
        '',
        `=== 文件尾 (后 ${tailSize} 字节, 偏移 0x${tailStart.toString(16)}) ===`,
        formatHexLine(tail, tailStart),
      ];
      if (headSize >= 4) {
        const magicHex = head.slice(0, 4).map((b: number) => b.toString(16).padStart(2, '0')).join(' ');
        lines.push('');
        lines.push(`魔数 (前4字节): ${magicHex}`);
      }
      return lines.join('\n');
    }}
  />
);
export default ToolComponent;
