import type { ToolDefinition } from '../../types';

export default {
  id: 'rot47',
  name: 'ROT47',
  category: 'classical-crypto',
  group: '移位',
  keywords: ['rot47', 'rotate47', 'ascii移位'],
  modes: ['encrypt', 'decrypt'],
  exampleInput: 'Hello World',
} satisfies ToolDefinition;
