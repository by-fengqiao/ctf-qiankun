import type { ToolDefinition } from '../../types';

export default {
  id: 'rot5',
  name: 'ROT5',
  category: 'classical-crypto',
  group: '移位',
  keywords: ['rot5', 'rotate5', '数字移位'],
  modes: ['encrypt', 'decrypt'],
  exampleInput: '12345',
} satisfies ToolDefinition;
