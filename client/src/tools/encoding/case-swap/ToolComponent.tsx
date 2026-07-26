import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      try {
        return Array.from(input, (c: string) => {
          if (c >= 'a' && c <= 'z') return c.toUpperCase();
          if (c >= 'A' && c <= 'Z') return c.toLowerCase();
          return c;
        }).join('');
      } catch (e) {
        return `错误: ${e instanceof Error ? e.message : '无效输入'}`;
      }
    }}
  />
);

export default ToolComponent;
