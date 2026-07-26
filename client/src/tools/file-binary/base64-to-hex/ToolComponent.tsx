import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      const trimmed = input.trim();
      if (trimmed.length === 0) throw new Error('输入为空');
      const binary = atob(trimmed);
      const hexChars: string[] = [];
      for (let i = 0; i < binary.length; i++) {
        hexChars.push(binary.charCodeAt(i).toString(16).padStart(2, '0'));
      }
      return hexChars.join('');
    }}
  />
);
export default ToolComponent;
