import type { ToolDefinition } from '../../types';

export default {
  id: 'unicode-escape',
  name: 'Unicode 转义',
  category: 'encoding',
  group: 'URL/Unicode',
  keywords: ['unicode', 'escape', 'unicode转义', 'uxxxx', 'unicode编码'],
  modes: ['encode', 'decode'],
  exampleInput: 'Hello 世界',
} satisfies ToolDefinition;
