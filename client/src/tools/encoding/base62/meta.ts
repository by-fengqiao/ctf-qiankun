import type { ToolDefinition } from '../../types';

export default {
  id: 'base62',
  name: 'Base62',
  category: 'encoding',
  group: 'Base族',
  keywords: ['base62', '六十二进制'],
  modes: ['encode', 'decode'],
  exampleInput: 'Hello World',
} satisfies ToolDefinition;
