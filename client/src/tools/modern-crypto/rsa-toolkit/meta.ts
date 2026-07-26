import type { ToolDefinition } from '../../types';

export default {
  id: 'rsa-toolkit',
  name: 'RSA综合工具',
  category: 'modern-crypto',
  group: 'RSA',
  keywords: ['rsa', '因数分解', '共模攻击', '广播攻击', 'wiener', 'keygen'],
  modes: ['execute'],
  defaultParams: { mode: 'factor' },
} satisfies ToolDefinition;
