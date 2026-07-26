import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';
import { getInputBytes } from '../../_shared/inputUtils';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      const bytes = getInputBytes(input);
      if (bytes.length === 0) return '请输入要查看二进制视图的内容';
      const lines: string[] = [];
      for (let i = 0; i < bytes.length; i++) {
        const b = bytes[i];
        const binary = b.toString(2).padStart(8, '0');
        const char = b >= 0x20 && b <= 0x7e ? String.fromCharCode(b) : '.';
        const hex = b.toString(16).padStart(2, '0');
        lines.push(`${i.toString(16).padStart(4, '0')}  ${binary}  0x${hex}  ${char}`);
      }
      return lines.join('\n');
    }}
  />
);
export default ToolComponent;
