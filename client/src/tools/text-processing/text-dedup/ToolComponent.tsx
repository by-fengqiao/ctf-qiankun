import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      const lines = input.split('\n');
      const seen = new Set<string>();
      const result: string[] = [];
      let removed = 0;
      for (const line of lines) {
        if (seen.has(line)) {
          removed++;
        } else {
          seen.add(line);
          result.push(line);
        }
      }
      return [
        ...result,
        `\n--- 已去除 ${removed} 个重复行 ---`,
      ].join('\n');
    }}
  />
);

export default ToolComponent;
