import type { ToolDefinition } from '../../types';

export default {
  id: 'base100',
  name: 'Base100',
  category: 'encoding',
  group: 'Base族',
  keywords: ['base100', 'emoji', '表情', '一百进制'],
  modes: ['encode', 'decode'],
  exampleInput: 'Hello World',
} satisfies ToolDefinition;
