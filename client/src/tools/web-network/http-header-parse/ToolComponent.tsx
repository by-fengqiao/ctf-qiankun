import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      const lines = input.split('\n').map((l) => l.trim()).filter(Boolean);
      if (lines.length === 0) {
        throw new Error('无 HTTP 头内容');
      }
      const result: Record<string, string> = {};
      for (const line of lines) {
        const colonIdx = line.indexOf(':');
        if (colonIdx === -1) {
          result[line] = '(无值)';
        } else {
          const key = line.slice(0, colonIdx).trim();
          const value = line.slice(colonIdx + 1).trim();
          result[key] = value;
        }
      }
      const entries = Object.entries(result);
      const output = entries.map(([k, v]) => `${k}:\n  ${v}`);
      return `共 ${entries.length} 个头部字段:\n\n${output.join('\n\n')}`;
    }}
  />
);

export default ToolComponent;
