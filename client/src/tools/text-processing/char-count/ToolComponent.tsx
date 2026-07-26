import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      const chars = input.length;
      const charsNoSpace = input.replace(/\s/gu, '').length;
      const words = input.trim() ? input.trim().split(/\s+/u).length : 0;
      const lines = input ? input.split(/\n/u).length : 0;
      const sentences = (input.match(/[^.!?。！？]+[.!?。！？]+/gu) || []).length;
      const paragraphs = input.trim() ? input.trim().split(/\n\s*\n/u).length : 0;
      return [
        `字符总数: ${chars}`,
        `字符(不含空格): ${charsNoSpace}`,
        `单词数: ${words}`,
        `行数: ${lines}`,
        `句子数: ${sentences}`,
        `段落数: ${paragraphs}`,
      ].join('\n');
    }}
  />
);

export default ToolComponent;
