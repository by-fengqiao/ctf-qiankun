import { pinyin } from 'pinyin-pro';
import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string, _mode: string, params: Record<string, unknown>) => {
      try {
        const type = (params.type as string) || 'with-tone';
        if (type === 'first-letter') {
          return pinyin(input, { pattern: 'first', toneType: 'none' }).replace(/\s/g, '');
        }
        if (type === 'without-tone') {
          return pinyin(input, { toneType: 'none' });
        }
        return pinyin(input, { toneType: 'symbol' });
      } catch (e) {
        return `错误: ${e instanceof Error ? e.message : '无效输入'}`;
      }
    }}
    paramsConfig={[
      {
        name: 'type',
        label: '类型',
        type: 'select',
        default: 'with-tone',
        options: [
          { value: 'with-tone', label: '带声调' },
          { value: 'without-tone', label: '不带声调' },
          { value: 'first-letter', label: '首字母' },
        ],
      },
    ]}
  />
);

export default ToolComponent;
