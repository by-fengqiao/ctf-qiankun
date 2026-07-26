import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    paramsConfig={[
      { name: 'length', label: '长度', type: 'text', placeholder: '16', default: '16' },
      {
        name: 'charset',
        label: '字符集',
        type: 'select',
        options: [
          { value: 'all', label: '全部' },
          { value: 'alnum', label: '字母+数字' },
          { value: 'alpha', label: '仅字母' },
          { value: 'num', label: '仅数字' },
        ],
        default: 'all',
      },
    ]}
    execute={(_input: string, _mode: string, params: Record<string, unknown>) => {
      const length = Math.min(128, Math.max(1, parseInt((params.length as string) ?? '16', 10) || 16));
      const charsetType = (params.charset as string) ?? 'all';
      const lower = 'abcdefghijklmnopqrstuvwxyz';
      const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const digits = '0123456789';
      const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      let charset = '';
      if (charsetType === 'all') charset = lower + upper + digits + special;
      else if (charsetType === 'alnum') charset = lower + upper + digits;
      else if (charsetType === 'alpha') charset = lower + upper;
      else charset = digits;
      if (!charset) throw new Error('字符集为空');
      const array = new Uint32Array(length);
      crypto.getRandomValues(array);
      let password = '';
      for (let i = 0; i < length; i++) {
        password += charset[array[i] % charset.length];
      }
      return password;
    }}
  />
);

export default ToolComponent;
