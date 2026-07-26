import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';
import { getInputBytes } from '../../_shared/inputUtils';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      const bytes = getInputBytes(input);
      const bits = bytes.length * 8;
      const kb = bytes.length / 1024;
      const mb = bytes.length / (1024 * 1024);
      const chars = input.length;
      const lines = input.split('\n').length;
      return [
        `字符数: ${chars}`,
        `行数: ${lines}`,
        `字节数 (UTF-8): ${bytes.length} bytes`,
        `位数: ${bits} bits`,
        `KB: ${kb.toFixed(4)} KB`,
        `MB: ${mb.toFixed(6)} MB`,
      ].join('\n');
    }}
  />
);
export default ToolComponent;
