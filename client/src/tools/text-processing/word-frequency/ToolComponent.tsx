import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      const words = input.toLowerCase().match(/\S+/gu) || [];
      if (words.length === 0) return '无单词';
      const freq = new Map<string, number>();
      for (const w of words) {
        freq.set(w, (freq.get(w) ?? 0) + 1);
      }
      const sorted = Array.from(freq.entries()).sort(
        (a: [string, number], b: [string, number]) => b[1] - a[1] || a[0].localeCompare(b[0]),
      );
      const maxLen = Math.max(...sorted.map((e: [string, number]) => e[0].length), 4);
      return [
        `单词\t次数\t占比`,
        ...sorted.map(
          ([word, count]: [string, number]) =>
            `${word.padEnd(maxLen)}\t${count}\t${((count / words.length) * 100).toFixed(1)}%`,
        ),
        `\n总单词数: ${words.length}`,
        `唯一单词数: ${freq.size}`,
      ].join('\n');
    }}
  />
);

export default ToolComponent;
