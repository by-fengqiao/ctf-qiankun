import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const RADIX_OPTIONS = [
  { value: '2', label: '二进制 (2)' },
  { value: '8', label: '八进制 (8)' },
  { value: '10', label: '十进制 (10)' },
  { value: '16', label: '十六进制 (16)' },
  { value: '36', label: '三十六进制 (36)' },
];

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string, _mode: string, params: Record<string, unknown>) => {
      try {
        const from = parseInt((params.from as string) || '10', 10);
        const to = parseInt((params.to as string) || '16', 10);
        const trimmed = input.trim();
        let num: bigint;
        if (from === 10) {
          num = BigInt(trimmed);
        } else {
          num = 0n;
          for (const ch of trimmed) {
            let digit: number;
            if (ch >= '0' && ch <= '9') digit = ch.charCodeAt(0) - 48;
            else if (ch >= 'a' && ch <= 'z') digit = ch.charCodeAt(0) - 87;
            else if (ch >= 'A' && ch <= 'Z') digit = ch.charCodeAt(0) - 55;
            else throw new Error(`无效字符: ${ch}`);
            if (digit >= from) throw new Error(`无效字符: ${ch}`);
            num = num * BigInt(from) + BigInt(digit);
          }
        }
        return num.toString(to);
      } catch (e) {
        return `错误: ${e instanceof Error ? e.message : '无效输入'}`;
      }
    }}
    paramsConfig={[
      { name: 'from', label: '源进制', type: 'select', default: '10', options: RADIX_OPTIONS },
      { name: 'to', label: '目标进制', type: 'select', default: '16', options: RADIX_OPTIONS },
    ]}
  />
);

export default ToolComponent;
