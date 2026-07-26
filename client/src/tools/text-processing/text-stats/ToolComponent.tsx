import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      const lines: string[] = input.split('\n');
      const words: string[] = input.split(/\s+/u).filter((w: string) => w.length > 0);
      const chars: number = input.length;
      const charsNoSpaces: number = input.replace(/\s/gu, '').length;
      const sentences: string[] = input.split(/[。.!?！？]+/u).filter((s: string) => s.trim().length > 0);
      const paragraphs: string[] = input.split(/\n\s*\n/u).filter((p: string) => p.trim().length > 0);
      const avgWordLen: number = words.length > 0
        ? words.reduce((sum: number, w: string) => sum + w.length, 0) / words.length
        : 0;
      return [
        `行数: ${lines.length}`,
        `单词数: ${words.length}`,
        `字符数: ${chars}`,
        `字符数(不含空格): ${charsNoSpaces}`,
        `句子数: ${sentences.length}`,
        `段落数: ${paragraphs.length}`,
        `平均单词长度: ${avgWordLen.toFixed(2)} 字符`,
      ].join('\n');
    }}
  />
);

export default ToolComponent;
