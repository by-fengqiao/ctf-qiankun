import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      const freq = new Map<string, number>();
      const total = input.length;
      for (const ch of input) {
        freq.set(ch, (freq.get(ch) ?? 0) + 1);
      }
      const entries = Array.from(freq.entries()).sort((a: [string, number], b: [string, number]) => b[1] - a[1]);
      const lines = entries.map(([ch, count]: [string, number]) => {
        const pct = total > 0 ? ((count / total) * 100).toFixed(2) : '0.00';
        const display = ch === ' ' ? '(space)' : ch === '\n' ? '(\\n)' : ch === '\t' ? '(\\t)' : ch;
        return `${display}: ${count} (${pct}%)`;
      });
      return `总字符数: ${total}\n唯一字符: ${freq.size}\n\n${lines.join('\n')}`;
    }}
  />
);
export default ToolComponent;
