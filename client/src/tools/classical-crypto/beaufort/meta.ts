import type { ToolDefinition } from '../../types';

export default {
  id: 'beaufort',
  name: '博福特密码',
  category: 'classical-crypto',
  group: '替换',
  keywords: ['beaufort', '博福特'],
  modes: ['encrypt', 'decrypt'],
  exampleInput: 'HELLO WORLD',
  defaultParams: { key: 'KEY' },
} satisfies ToolDefinition;
