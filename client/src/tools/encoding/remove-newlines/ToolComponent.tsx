import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string, _mode: string, params: Record<string, unknown>) => {
      try {
        const type = (params.type as string) || 'to-space';
        if (type === 'to-space') {
          return input.replace(/\r?\n/g, ' ');
        }
        return input.replace(/\r?\n/g, '');
      } catch (e) {
        return `错误: ${e instanceof Error ? e.message : '无效输入'}`;
      }
    }}
    paramsConfig={[
      {
        name: 'type',
        label: '方式',
        type: 'select',
        default: 'to-space',
        options: [
          { value: 'to-space', label: '替换为空格' },
          { value: 'remove', label: '直接删除' },
        ],
      },
    ]}
  />
);

export default ToolComponent;
