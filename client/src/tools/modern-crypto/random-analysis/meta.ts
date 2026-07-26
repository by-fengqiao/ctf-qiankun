import type { ToolDefinition } from '../../types';

export default {
  id: 'random-analysis',
  name: '随机数分析',
  category: 'modern-crypto',
  group: '随机数',
  keywords: ['random', 'chi-square', 'autocorrelation', 'entropy', 'prng', '随机数'],
  modes: ['analyze'],
} satisfies ToolDefinition;
