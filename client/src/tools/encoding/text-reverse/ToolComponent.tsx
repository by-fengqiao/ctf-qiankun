import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string, _mode: string, params: Record<string, unknown>) => {
      try {
        const type = (params.type as string) || 'char';
        if (type === 'line') {
          return input.split('\n').reverse().join('\n');
        }
        return Array.from(input).reverse().join('');
      } catch (e) {
        return `错误: ${e instanceof Error ? e.message : '无效输入'}`;
      }
    }}
    paramsConfig={[
      {
        name: 'type',
        label: '方式',
        type: 'select',
        default: 'char',
        options: [
          { value: 'char', label: '字符反转' },
          { value: 'line', label: '行反转' },
        ],
      },
    ]}
  />
);

export default ToolComponent;
