import type { ToolDefinition } from '../../types';

export default {
  id: 'base58',
  name: 'Base58',
  category: 'encoding',
  group: 'Base族',
  keywords: ['base58', 'bitcoin', '比特币', '五十八进制'],
  modes: ['encode', 'decode'],
  exampleInput: 'Hello World',
} satisfies ToolDefinition;
