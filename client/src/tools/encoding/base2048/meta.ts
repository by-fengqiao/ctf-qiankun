import type { ToolDefinition } from '../../types';

export default {
  id: 'base2048',
  name: 'Base2048',
  category: 'encoding',
  group: 'Base族',
  keywords: ['base2048', '二千零四十八进制', 'unicode'],
  modes: ['encode', 'decode'],
  exampleInput: 'Hello World',
} satisfies ToolDefinition;
