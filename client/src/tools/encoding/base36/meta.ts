import type { ToolDefinition } from '../../types';

export default {
  id: 'base36',
  name: 'Base36',
  category: 'encoding',
  group: 'Base族',
  keywords: ['base36', '三十六进制'],
  modes: ['encode', 'decode'],
  exampleInput: 'Hello',
} satisfies ToolDefinition;
