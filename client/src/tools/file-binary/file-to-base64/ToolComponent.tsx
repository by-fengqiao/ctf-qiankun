import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';
import { getInputBytes } from '../../_shared/inputUtils';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      if (input.length === 0) throw new Error('输入为空');
      const bytes = getInputBytes(input);
      let binary = '';
      for (const b of bytes) {
        binary += String.fromCharCode(b);
      }
      return btoa(binary);
    }}
  />
);
export default ToolComponent;
