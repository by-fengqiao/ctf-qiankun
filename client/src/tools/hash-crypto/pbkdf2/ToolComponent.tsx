import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';
import CryptoJS from 'crypto-js';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    paramsConfig={[
      { name: 'salt', label: '盐值', type: 'text', placeholder: 'salt', default: 'salt' },
      { name: 'iterations', label: '迭代次数', type: 'text', placeholder: '10000', default: '10000' },
      {
        name: 'keySize',
        label: '密钥长度',
        type: 'select',
        default: '256',
        options: [
          { value: '128', label: '128 bit' },
          { value: '256', label: '256 bit' },
          { value: '512', label: '512 bit' },
        ],
      },
    ]}
    execute={(input: string, _mode: string, params: Record<string, unknown>) => {
      const password = input;
      const salt = (params.salt as string) ?? 'salt';
      const iterations = Math.max(
        1,
        parseInt((params.iterations as string) ?? '10000', 10) || 10000,
      );
      const keyBits = parseInt((params.keySize as string) ?? '256', 10);
      const key = CryptoJS.PBKDF2(password, salt, {
        keySize: keyBits / 32,
        iterations,
      });
      return [
        '=== PBKDF2 密钥派生 ===',
        `盐值: ${salt}`,
        `迭代次数: ${iterations}`,
        `密钥长度: ${keyBits} bit`,
        '',
        `派生密钥: ${key.toString()}`,
      ].join('\n');
    }}
  />
);
export default ToolComponent;
