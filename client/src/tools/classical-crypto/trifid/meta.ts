import type { ToolDefinition } from '../../types';

export default {
  id: 'trifid',
  name: 'Trifid 密码',
  category: 'classical-crypto',
  group: '矩阵',
  keywords: ['trifid', '三分密码', '3d grid'],
  modes: ['encrypt', 'decrypt'],
  exampleInput: 'HELLO',
  defaultParams: { key: '', period: '5' },
} satisfies ToolDefinition;
