import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string, _mode: string, params: Record<string, unknown>) => {
      try {
        const type = (params.type as string) || 'line';
        if (type === 'sentence') {
          const sentences = input.match(/[^.!?。！？]+[.!?。！？]*/g);
          return (sentences ?? [input]).map((s: string) => s.trim()).join('\n');
        }
        if (type === 'word') {
          return input.split(/\s+/).join('\n');
        }
        return input.split('\n').map((l: string) => l.trim()).join('\n');
      } catch (e) {
        return `错误: ${e instanceof Error ? e.message : '无效输入'}`;
      }
    }}
    paramsConfig={[
      {
        name: 'type',
        label: '方式',
        type: 'select',
        default: 'line',
        options: [
          { value: 'line', label: '按行' },
          { value: 'sentence', label: '按句子' },
          { value: 'word', label: '按单词' },
        ],
      },
    ]}
  />
);

export default ToolComponent;
