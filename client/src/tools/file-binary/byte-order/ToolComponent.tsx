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

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    paramsConfig={[
      {
        name: 'wordSize',
        label: '字长',
        type: 'select',
        default: '4',
        options: [
          { value: '2', label: '2 bytes (16-bit)' },
          { value: '4', label: '4 bytes (32-bit)' },
          { value: '8', label: '8 bytes (64-bit)' },
        ],
      },
    ]}
    execute={(input: string, _mode: string, params: Record<string, unknown>) => {
      const wordSize = parseInt((params.wordSize as string) ?? '4', 10) || 4;
      if (!input.trim()) return '请输入要进行字节序转换的十六进制数据';
      const cleaned = input.replace(/\s/g, '').toLowerCase();
      if (cleaned.length % 2 !== 0) return '十六进制长度必须为偶数，请检查输入';
      if (!/^[0-9a-f]*$/.test(cleaned)) return '包含非十六进制字符，请检查输入';
      const bytes = hexToBytes(input);
      if (bytes.length === 0) return '请输入要进行字节序转换的十六进制数据';
      if (bytes.length % wordSize !== 0) {
        return '数据长度 ' + bytes.length + ' 不是 ' + wordSize + ' 的倍数，无法按字分组';
      }
      const swapped: number[] = [];
      for (let i = 0; i < bytes.length; i += wordSize) {
        const word = bytes.slice(i, i + wordSize);
        swapped.push(...word.reverse());
      }
      const originalHex = bytes.map((b: number) => b.toString(16).padStart(2, '0')).join('');
      const swappedHex = swapped.map((b: number) => b.toString(16).padStart(2, '0')).join('');
      return `原始 (Big Endian): ${originalHex}\n转换 (Little Endian): ${swappedHex}\n\n解释: 每 ${wordSize} 字节为一组进行反转，模拟大端↔小端转换`;
    }}
  />
);
export default ToolComponent;
