import type { ToolDefinition } from '../../types';

export default {
  id: 'porta',
  name: 'Porta 密码',
  category: 'classical-crypto',
  group: '替换',
  keywords: ['porta', '波塔'],
  modes: ['encrypt', 'decrypt'],
  exampleInput: 'HELLO',
  defaultParams: { key: 'KEY' },
} satisfies ToolDefinition;
