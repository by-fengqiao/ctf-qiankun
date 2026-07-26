import type { ToolDefinition } from '../../types';

export default {
  id: 'adfgvx',
  name: 'ADFGVX 密码',
  category: 'classical-crypto',
  group: '矩阵',
  keywords: ['adfgvx', 'ADFGVX', '一战密码'],
  modes: ['encrypt', 'decrypt'],
  exampleInput: 'HELLO',
  defaultParams: { key: 'PRIVACY', gridkey: 'KEYWORD' },
} satisfies ToolDefinition;
