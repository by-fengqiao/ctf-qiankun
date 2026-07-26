import type { ToolDefinition } from '../../types';

export default {
  id: 'base16',
  name: 'Base16 / Hex',
  category: 'encoding',
  group: 'Base族',
  keywords: ['base16', 'hex', 'hexadecimal', '十六进制'],
  modes: ['encode', 'decode'],
  exampleInput: 'Hello World',
} satisfies ToolDefinition;
