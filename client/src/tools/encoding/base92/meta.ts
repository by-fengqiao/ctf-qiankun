import type { ToolDefinition } from '../../types';

export default {
  id: 'base92',
  name: 'Base92',
  category: 'encoding',
  group: 'Base族',
  keywords: ['base92', '九十二进制'],
  modes: ['encode', 'decode'],
  exampleInput: 'Hello World',
} satisfies ToolDefinition;
