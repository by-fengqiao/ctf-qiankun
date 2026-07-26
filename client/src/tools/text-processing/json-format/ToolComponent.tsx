import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    paramsConfig={[
      {
        name: 'indent',
        label: '缩进',
        type: 'select',
        options: [
          { value: '2', label: '2 空格' },
          { value: '4', label: '4 空格' },
          { value: '0', label: 'Tab' },
        ],
        default: '2',
      },
    ]}
    execute={(input: string, _mode: string, params: Record<string, unknown>) => {
      const indentVal = (params.indent as string) ?? '2';
      const indent = indentVal === '0' ? '\t' : parseInt(indentVal, 10);
      const parsed = JSON.parse(input);
      return JSON.stringify(parsed, null, indent);
    }}
  />
);

export default ToolComponent;
