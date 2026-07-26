import type { ToolDefinition } from '../../types';

export default {
  id: 'autokey',
  name: '自动密钥密码',
  category: 'classical-crypto',
  group: '替换',
  keywords: ['autokey', '自动密钥', 'autokey cipher'],
  modes: ['encrypt', 'decrypt'],
  exampleInput: 'HELLO WORLD',
  defaultParams: { key: 'KEY' },
} satisfies ToolDefinition;
