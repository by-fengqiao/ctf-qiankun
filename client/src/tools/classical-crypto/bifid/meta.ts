import type { ToolDefinition } from '../../types';

export default {
  id: 'bifid',
  name: 'Bifid 密码',
  category: 'classical-crypto',
  group: '矩阵',
  keywords: ['bifid', '双分密码'],
  modes: ['encrypt', 'decrypt'],
  exampleInput: 'HELLO WORLD',
  defaultParams: { key: '', period: '5' },
} satisfies ToolDefinition;
