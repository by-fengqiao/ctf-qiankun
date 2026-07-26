import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    modeOptions={[
      { value: 'lines', label: '按行' },
      { value: 'words', label: '按词' },
    ]}
    execute={(input: string, mode: string) => {
      if (mode === 'words') {
        const words = input.match(/\S+/gu) || [];
        const freq = new Map<string, number>();
        for (const w of words) {
          freq.set(w, (freq.get(w) ?? 0) + 1);
        }
        const dups = Array.from(freq.entries())
          .filter((e: [string, number]) => e[1] > 1)
          .sort((a: [string, number], b: [string, number]) => b[1] - a[1]);
        if (dups.length === 0) return '未找到重复单词';
        return [
          `重复单词\t出现次数`,
          ...dups.map(([word, count]: [string, number]) => `${word}\t${count}`),
          `\n总重复单词数: ${dups.length}`,
        ].join('\n');
      }
      const lines = input.split('\n');
      const freq = new Map<string, number>();
      for (const line of lines) {
        freq.set(line, (freq.get(line) ?? 0) + 1);
      }
      const dups = Array.from(freq.entries())
        .filter((e: [string, number]) => e[1] > 1)
        .sort((a: [string, number], b: [string, number]) => b[1] - a[1]);
      if (dups.length === 0) return '未找到重复行';
      return [
        `重复行\t出现次数`,
        ...dups.map(([line, count]: [string, number]) => `${line}\t${count}`),
        `\n总重复行数: ${dups.length}`,
      ].join('\n');
    }}
  />
);

export default ToolComponent;
