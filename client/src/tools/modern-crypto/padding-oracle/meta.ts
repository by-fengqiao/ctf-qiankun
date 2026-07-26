import type { ToolDefinition } from '../../types';

export default {
  id: 'padding-oracle',
  name: 'Padding-Oracle辅助',
  category: 'modern-crypto',
  group: '对称密码',
  keywords: ['padding', 'oracle', 'cbc', '攻击', 'pkcs7'],
  modes: ['execute'],
  defaultParams: { mode: 'next-byte', block: '1', byte: '15', oracle: 'valid' },
} satisfies ToolDefinition;
