import type { ToolDefinition } from '../../types';

export default {
  id: 'rot13',
  name: 'ROT13',
  category: 'classical-crypto',
  group: '移位',
  keywords: ['rot13', 'rotate13', '旋转13'],
  modes: ['encrypt', 'decrypt'],
  exampleInput: 'Hello World',
} satisfies ToolDefinition;
