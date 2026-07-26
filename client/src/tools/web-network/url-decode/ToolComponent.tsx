import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      let result = input;
      let prev = '';
      let iterations = 0;
      while (prev !== result && iterations < 10) {
        prev = result;
        result = decodeURIComponent(result);
        iterations++;
      }
      const lines: string[] = [];
      lines.push(`解码结果:\n${result}`);
      lines.push('');
      lines.push(`解码次数: ${iterations}`);
      if (iterations === 10) {
        lines.push('(达到最大解码次数，可能仍含编码字符)');
      }
      return lines.join('\n');
    }}
  />
);

export default ToolComponent;
