import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string, _mode: string, params: Record<string, unknown>) => {
      try {
        const type = (params.type as string) || 'whitespace';
        if (type === 'spaces') {
          return input.replace(/ /g, '');
        }
        return input.replace(/\s/g, '');
      } catch (e) {
        return `错误: ${e instanceof Error ? e.message : '无效输入'}`;
      }
    }}
    paramsConfig={[
      {
        name: 'type',
        label: '方式',
        type: 'select',
        default: 'whitespace',
        options: [
          { value: 'whitespace', label: '去所有空白' },
          { value: 'spaces', label: '仅去空格' },
        ],
      },
    ]}
  />
);

export default ToolComponent;
