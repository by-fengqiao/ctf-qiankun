import type { ToolDefinition } from '../../types';

export default {
  id: 'columnar-transposition',
  name: '列置换密码',
  category: 'classical-crypto',
  group: '换位',
  keywords: ['columnar', '列置换', 'column transposition'],
  modes: ['encrypt', 'decrypt'],
  exampleInput: 'HELLO WORLD',
  defaultParams: { key: 'ZEBRA' },
} satisfies ToolDefinition;
