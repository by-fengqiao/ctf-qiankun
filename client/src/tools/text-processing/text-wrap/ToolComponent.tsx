import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    paramsConfig={[
      { name: 'width', label: '宽度', type: 'text', placeholder: '40', default: '40' },
    ]}
    execute={(input: string, _mode: string, params: Record<string, unknown>) => {
      const width = Math.max(1, parseInt((params.width as string) ?? '40', 10) || 40);
      const lines = input.split('\n');
      const result: string[] = [];
      for (const line of lines) {
        if (line.length <= width) {
          result.push(line);
          continue;
        }
        let pos = 0;
        while (pos < line.length) {
          result.push(line.slice(pos, pos + width));
          pos += width;
        }
      }
      return result.join('\n');
    }}
  />
);

export default ToolComponent;
