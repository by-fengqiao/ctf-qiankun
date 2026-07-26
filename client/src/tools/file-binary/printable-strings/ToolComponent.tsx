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

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    paramsConfig={[
      {
        name: 'minLen',
        label: '最小长度',
        type: 'select',
        default: '4',
        options: [
          { value: '3', label: '3' },
          { value: '4', label: '4' },
          { value: '5', label: '5' },
          { value: '6', label: '6' },
          { value: '8', label: '8' },
        ],
      },
    ]}
    execute={(input: string, _mode: string, params: Record<string, unknown>) => {
      const minLen = parseInt((params.minLen as string) ?? '4', 10) || 4;
      const bytes = hexToBytes(input);
      if (bytes.length === 0) throw new Error('输入为空');
      const strings: string[] = [];
      let current = '';
      let startOffset = 0;
      for (let i = 0; i < bytes.length; i++) {
        const b = bytes[i];
        if (b >= 0x20 && b <= 0x7e) {
          if (current.length === 0) startOffset = i;
          current += String.fromCharCode(b);
        } else {
          if (current.length >= minLen) {
            strings.push(`0x${startOffset.toString(16).padStart(4, '0')}: ${current}`);
          }
          current = '';
        }
      }
      if (current.length >= minLen) {
        strings.push(`0x${startOffset.toString(16).padStart(4, '0')}: ${current}`);
      }
      if (strings.length === 0) return '未找到可打印字符串';
      return `找到 ${strings.length} 个字符串:\n\n${strings.join('\n')}`;
    }}
  />
);
export default ToolComponent;
