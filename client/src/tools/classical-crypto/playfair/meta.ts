import type { ToolDefinition } from '../../types';

export default {
  id: 'playfair',
  name: '普莱费尔密码',
  category: 'classical-crypto',
  group: '矩阵',
  keywords: ['playfair', '普莱费尔', 'digraph', '双字母'],
  modes: ['encrypt', 'decrypt'],
  exampleInput: 'HELLO WORLD',
  defaultParams: { key: 'PLAYFAIR' },
} satisfies ToolDefinition;
