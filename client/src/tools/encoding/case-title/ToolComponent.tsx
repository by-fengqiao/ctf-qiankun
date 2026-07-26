import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      try {
        return input.replace(/\w\S*/g, (match: string) =>
          match.charAt(0).toUpperCase() + match.slice(1).toLowerCase(),
        );
      } catch (e) {
        return `错误: ${e instanceof Error ? e.message : '无效输入'}`;
      }
    }}
  />
);

export default ToolComponent;
