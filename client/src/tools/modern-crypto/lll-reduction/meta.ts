import type { ToolDefinition } from '../../types';

export default {
  id: 'lll-reduction',
  name: 'LLL格归约',
  description: 'LLL 格基归约算法 (δ=3/4), 含 Gram-Schmidt 正交化、最短向量与行列式计算',
  category: 'modern-crypto',
  group: '格与背包',
  keywords: ['lll', 'lattice', '格', '归约', 'gram-schmidt', '最短向量', '行列式', 'basis reduction'],
  modes: ['execute'],
  exampleInput: '1 2 3\n4 5 6\n7 8 10',
} satisfies ToolDefinition;
