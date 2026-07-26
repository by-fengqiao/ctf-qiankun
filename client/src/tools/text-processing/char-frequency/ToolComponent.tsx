import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      const freq = new Map<string, number>();
      for (const ch of input) {
        freq.set(ch, (freq.get(ch) ?? 0) + 1);
      }
      if (freq.size === 0) return '无字符';
      const sorted = Array.from(freq.entries()).sort(
        (a: [string, number], b: [string, number]) => b[1] - a[1],
      );
      const total = input.length;
      return [
        `字符\t次数\t占比`,
        ...sorted.map(([ch, count]: [string, number]) => {
          const display = ch === '\n' ? '\\n' : ch === '\t' ? '\\t' : ch === ' ' ? '␣' : ch;
          return `${display}\t${count}\t${((count / total) * 100).toFixed(1)}%`;
        }),
        `\n总字符数: ${total}`,
        `唯一字符数: ${freq.size}`,
      ].join('\n');
    }}
  />
);

export default ToolComponent;
