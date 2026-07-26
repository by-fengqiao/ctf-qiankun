import type { ToolDefinition } from '../../types';

export default {
  id: 'dna-cipher',
  name: 'DNA 编码',
  category: 'classical-crypto',
  group: '编码',
  keywords: ['dna', '基因', 'ATCG', '核酸'],
  modes: ['encode', 'decode'],
  exampleInput: 'Hi',
} satisfies ToolDefinition;
