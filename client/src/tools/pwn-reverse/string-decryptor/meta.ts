import type { ToolDefinition } from '../../types';

export default {
  id: 'string-decryptor',
  name: '字符串解密器',
  category: 'pwn-reverse',
  group: '辅助',
  keywords: ['decrypt', 'xor', 'rc4', 'string', '字符串解密', '暴力破解'],
  modes: ['execute'],
  defaultParams: { mode: 'xor-brute' },
} satisfies ToolDefinition;
