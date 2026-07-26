import type { ToolDefinition } from '../../types';

export default {
  id: 'ascii85',
  name: 'Ascii85',
  category: 'encoding',
  group: 'Base族',
  keywords: ['ascii85', 'base85', 'b85', '编码', '解码'],
  modes: ['encode', 'decode'],
  exampleInput: 'Hello World',
} satisfies ToolDefinition;
