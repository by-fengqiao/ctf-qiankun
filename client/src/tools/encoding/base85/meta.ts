import type { ToolDefinition } from '../../types';

export default {
  id: 'base85',
  name: 'Base85 / Ascii85',
  category: 'encoding',
  group: 'Base族',
  keywords: ['base85', 'ascii85', '八十五进制'],
  modes: ['encode', 'decode'],
  exampleInput: 'Hello World',
} satisfies ToolDefinition;
