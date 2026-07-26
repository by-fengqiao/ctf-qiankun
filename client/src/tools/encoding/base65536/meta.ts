import type { ToolDefinition } from '../../types';

export default {
  id: 'base65536',
  name: 'Base65536',
  category: 'encoding',
  group: 'Base族',
  keywords: ['base65536', 'b65536', 'CJK编码', '编码', '解码'],
  modes: ['encode', 'decode'],
  exampleInput: 'Hello World',
} satisfies ToolDefinition;
