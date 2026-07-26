import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    paramsConfig={[
      { name: 'length', label: '长度', type: 'text', placeholder: '32', default: '32' },
      {
        name: 'charset',
        label: '字符集',
        type: 'select',
        options: [
          { value: 'hex', label: '十六进制' },
          { value: 'base64', label: 'Base64' },
          { value: 'alnum', label: '字母+数字' },
          { value: 'custom', label: '自定义' },
        ],
        default: 'hex',
      },
      { name: 'customChars', label: '自定义字符', type: 'text', placeholder: 'ABC123', default: '' },
    ]}
    execute={(_input: string, _mode: string, params: Record<string, unknown>) => {
      const length = Math.min(1024, Math.max(1, parseInt((params.length as string) ?? '32', 10) || 32));
      const charsetType = (params.charset as string) ?? 'hex';
      let charset = '';
      if (charsetType === 'hex') charset = '0123456789abcdef';
      else if (charsetType === 'base64') charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
      else if (charsetType === 'alnum') charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      else charset = (params.customChars as string) ?? 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      if (!charset) throw new Error('字符集为空');
      const array = new Uint32Array(length);
      crypto.getRandomValues(array);
      let result = '';
      for (let i = 0; i < length; i++) {
        result += charset[array[i] % charset.length];
      }
      return result;
    }}
  />
);

export default ToolComponent;
