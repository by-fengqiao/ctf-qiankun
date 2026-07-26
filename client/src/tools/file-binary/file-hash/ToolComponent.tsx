import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';
import CryptoJS from 'crypto-js';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    paramsConfig={[
      {
        name: 'algorithm',
        label: '算法',
        type: 'select',
        default: 'MD5',
        options: [
          { value: 'MD5', label: 'MD5' },
          { value: 'SHA1', label: 'SHA-1' },
          { value: 'SHA256', label: 'SHA-256' },
          { value: 'SHA512', label: 'SHA-512' },
          { value: 'SHA224', label: 'SHA-224' },
          { value: 'SHA384', label: 'SHA-384' },
        ],
      },
    ]}
    execute={(input: string, _mode: string, params: Record<string, unknown>) => {
      const algorithm = (params.algorithm as string) ?? 'MD5';
      switch (algorithm) {
        case 'MD5': return CryptoJS.MD5(input).toString();
        case 'SHA1': return CryptoJS.SHA1(input).toString();
        case 'SHA256': return CryptoJS.SHA256(input).toString();
        case 'SHA512': return CryptoJS.SHA512(input).toString();
        case 'SHA224': return CryptoJS.SHA224(input).toString();
        case 'SHA384': return CryptoJS.SHA384(input).toString();
        default: throw new Error(`不支持的算法: ${algorithm}`);
      }
    }}
  />
);
export default ToolComponent;
