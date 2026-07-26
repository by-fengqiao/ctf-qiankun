import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      const bytes = new TextEncoder().encode(input);
      let sum = 0;
      for (let i = 0; i < bytes.length; i++) {
        sum = (sum + bytes[i]) & 0xffff;
      }
      return sum.toString(16).padStart(4, '0').toUpperCase();
    }}
  />
);
export default ToolComponent;
