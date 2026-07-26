import type { ToolDefinition } from '../../types';

export default {
  id: 'rot18',
  name: 'ROT18',
  category: 'classical-crypto',
  group: '移位',
  keywords: ['rot18', 'rotate18', 'rot13+rot5'],
  modes: ['encrypt', 'decrypt'],
  exampleInput: 'Hello 123',
} satisfies ToolDefinition;
