import type { ToolDefinition } from '../../types';

export default {
  id: 'xor-toolkit',
  name: 'XOR综合分析',
  category: 'modern-crypto',
  group: '综合',
  keywords: ['xor', '异或', '单字节', 'crib', 'repeat-key', '破解'],
  modes: ['execute'],
  defaultParams: { mode: 'single-byte' },
} satisfies ToolDefinition;
