import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';
import CryptoJS from 'crypto-js';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    paramsConfig={[
      {
        name: 'key',
        label: '密钥',
        type: 'text',
        placeholder: 'secret',
        default: 'secret',
      },
    ]}
    execute={(input: string, _mode: string, params: Record<string, unknown>) => {
      const key = (params.key as string) ?? 'secret';
      return CryptoJS.HmacSHA256(input, key).toString();
    }}
  />
);
export default ToolComponent;
