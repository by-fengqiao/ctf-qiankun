import type { ToolDefinition } from '../../types';

export default {
  id: 'book-cipher',
  name: '书本密码',
  category: 'classical-crypto',
  group: '编码',
  keywords: ['book', 'cipher', '书本密码', 'book cipher'],
  modes: ['encrypt', 'decrypt'],
  exampleInput: 'HELLO',
} satisfies ToolDefinition;
