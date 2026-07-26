import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      try {
        const clean = input.replace(/[\s-]/g, '');
        const pairs = clean.match(/.{1,2}/g);
        if (!pairs) return '错误: 无效的十六进制输入';
        return pairs.reverse().join('');
      } catch (e) {
        return `错误: ${e instanceof Error ? e.message : '无效输入'}`;
      }
    }}
  />
);

export default ToolComponent;
