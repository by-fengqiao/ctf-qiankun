import type { ToolDefinition } from '../../types';

export default {
  id: 'polybius',
  name: '波利比奥斯方阵',
  category: 'classical-crypto',
  group: '矩阵',
  keywords: ['polybius', '波利比奥斯', '棋盘密码', 'polybius square'],
  modes: ['encode', 'decode'],
  exampleInput: 'HELLO',
  defaultParams: { key: '' },
} satisfies ToolDefinition;
