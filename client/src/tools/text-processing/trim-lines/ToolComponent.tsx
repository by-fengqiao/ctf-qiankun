import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    modeOptions={[
      { value: 'encode', label: '两侧' },
      { value: 'analyze', label: '左侧' },
      { value: 'generate', label: '右侧' },
    ]}
    execute={(input: string, mode: string) => {
      const lines = input.split('\n');
      if (mode === 'analyze') {
        return lines.map((l: string) => l.replace(/^\s+/u, '')).join('\n');
      }
      if (mode === 'generate') {
        return lines.map((l: string) => l.replace(/\s+$/u, '')).join('\n');
      }
      return lines.map((l: string) => l.trim()).join('\n');
    }}
  />
);

export default ToolComponent;
