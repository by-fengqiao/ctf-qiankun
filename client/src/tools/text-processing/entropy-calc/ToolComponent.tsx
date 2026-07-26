import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      if (input.length === 0) return '输入为空';
      const freq = new Map<string, number>();
      for (const char of input) {
        freq.set(char, (freq.get(char) ?? 0) + 1);
      }
      const total: number = input.length;
      let entropy = 0;
      for (const count of freq.values()) {
        const p: number = count / total;
        entropy -= p * Math.log2(p);
        }
      const maxEntropy: number = Math.log2(freq.size);
      const efficiency: number = maxEntropy > 0 ? (entropy / maxEntropy) * 100 : 0;
      const lines: string[] = [
        `Shannon 熵: ${entropy.toFixed(4)} bits/字符`,
        `最大可能熵: ${maxEntropy.toFixed(4)} bits/字符`,
        `效率: ${efficiency.toFixed(2)}%`,
        `总字符数: ${total}`,
        `唯一字符数: ${freq.size}`,
        '',
        '字符频率分布:',
      ];
      const sorted: Array<[string, number]> = [...freq.entries()].sort(
        (a: [string, number], b: [string, number]) => b[1] - a[1],
      );
      for (const [char, count] of sorted) {
        const display: string = char === ' ' ? '(空格)' : char === '\n' ? '(换行)' : char === '\t' ? '(制表)' : char;
        lines.push(`  ${display}: ${count} 次 (${((count / total) * 100).toFixed(1)}%)`);
      }
      return lines.join('\n');
    }}
  />
);

export default ToolComponent;
