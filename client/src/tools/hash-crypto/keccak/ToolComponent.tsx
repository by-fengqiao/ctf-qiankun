import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';
import CryptoJS from 'crypto-js';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    paramsConfig={[
      {
        name: 'outputLength',
        label: '输出长度',
        type: 'select',
        default: '256',
        options: [
          { value: '224', label: '224' },
          { value: '256', label: '256' },
          { value: '384', label: '384' },
          { value: '512', label: '512' },
        ],
      },
    ]}
    execute={(input: string, _mode: string, params: Record<string, unknown>) => {
      const len = parseInt((params.outputLength as string) ?? '256', 10);
      return CryptoJS.SHA3(input, { outputLength: len }).toString();
    }}
  />
);
export default ToolComponent;
