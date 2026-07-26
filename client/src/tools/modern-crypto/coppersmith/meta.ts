import type { ToolDefinition } from '../../types';

export default {
  id: 'coppersmith',
  name: 'Coppersmith小根求解',
  description: 'Coppersmith 小根求解 (简化版 LLL 格归约, 适用于多项式模 n 的小整数根)',
  category: 'modern-crypto',
  group: 'RSA',
  keywords: ['coppersmith', '小根', 'lattice', 'lll', '格', 'rsa', '格归约', 'howgrave-graham'],
  modes: ['execute'],
  exampleInput: '15\n1 2 1\n5',
  defaultParams: { degree: '2', beta: '0.5' },
} satisfies ToolDefinition;
