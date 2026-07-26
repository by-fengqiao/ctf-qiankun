import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      const parsed = JSON.parse(input);
      return JSON.stringify(parsed);
    }}
  />
);

export default ToolComponent;
