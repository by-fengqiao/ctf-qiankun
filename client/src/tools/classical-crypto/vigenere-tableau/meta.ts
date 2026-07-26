import type { ToolDefinition } from '../../types';

export default {
  id: 'vigenere-tableau',
  name: '维吉尼亚表',
  category: 'classical-crypto',
  group: '替换',
  keywords: ['vigenere', 'tableau', '维吉尼亚表', 'tabula recta'],
  modes: ['encrypt', 'decrypt', 'analyze'],
  exampleInput: 'HELLO',
  defaultParams: { key: 'KEY' },
} satisfies ToolDefinition;
