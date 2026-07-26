import type { ToolDefinition } from '../../types';

export default {
  id: 'hill',
  name: '希尔密码',
  category: 'classical-crypto',
  group: '矩阵',
  keywords: ['hill', '希尔', '矩阵密码', 'matrix'],
  modes: ['encrypt', 'decrypt'],
  exampleInput: 'HELLO',
  defaultParams: { key: 'GYBNQKURP' },
} satisfies ToolDefinition;
