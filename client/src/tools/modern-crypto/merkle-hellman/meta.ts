import type { ToolDefinition } from '../../types';

export default {
  id: 'merkle-hellman',
  name: 'Merkle-Hellman背包破解',
  description: 'Merkle-Hellman背包密码系统攻击：LLL格归约或暴力搜索恢复超递增私钥',
  category: 'modern-crypto',
  group: '格与背包',
  keywords: ['merkle', 'hellman', 'knapsack', '背包', 'LLL', '格归约'],
  modes: ['execute'],
  exampleInput: '5 14 28 53 107\n1 0 1 0 1',
  defaultParams: { mode: 'auto' },
} satisfies ToolDefinition;
