import type { ToolDefinition } from '../../types';

export default {
  id: 'vigenere',
  name: '维吉尼亚密码',
  category: 'classical-crypto',
  group: '替换',
  keywords: ['vigenere', '维吉尼亚', '多表替换'],
  modes: ['encrypt', 'decrypt'],
  exampleInput: 'HELLO WORLD',
  defaultParams: { key: 'KEY' },
} satisfies ToolDefinition;
