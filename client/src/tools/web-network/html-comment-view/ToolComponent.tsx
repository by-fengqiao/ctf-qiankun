import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      const regex = /<!--([\s\S]*?)-->/g;
      const comments: string[] = [];
      let match: RegExpExecArray | null;
      while ((match = regex.exec(input)) !== null) {
        comments.push(match[1].trim());
      }
      if (comments.length === 0) {
        return '未找到 HTML 注释';
      }
      const lines = comments.map((c: string, i: number) => `[${i + 1}] ${c}`);
      return `共找到 ${comments.length} 条 HTML 注释:\n\n${lines.join('\n')}`;
    }}
  />
);

export default ToolComponent;
