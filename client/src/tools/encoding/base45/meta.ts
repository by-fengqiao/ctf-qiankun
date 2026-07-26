import type { ToolDefinition } from '../../types';

export default {
  id: 'base45',
  name: 'Base45',
  category: 'encoding',
  group: 'Base族',
  keywords: ['base45', 'rfc9285', 'qr', '四十五进制'],
  modes: ['encode', 'decode'],
  exampleInput: 'Hello',
} satisfies ToolDefinition;
