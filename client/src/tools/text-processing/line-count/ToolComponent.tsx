import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      if (!input) return '总行数: 0\n空行数: 0\n非空行数: 0';
      const lines = input.split('\n');
      const total = lines.length;
      const empty = lines.filter((l: string) => l.trim() === '').length;
      const nonEmpty = total - empty;
      return [
        `总行数: ${total}`,
        `空行数: ${empty}`,
        `非空行数: ${nonEmpty}`,
      ].join('\n');
    }}
  />
);

export default ToolComponent;
