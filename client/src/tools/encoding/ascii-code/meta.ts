import type { ToolDefinition } from '../../types';

export default {
  id: 'ascii-code',
  name: 'ASCII 码',
  category: 'encoding',
  group: '其他',
  keywords: ['ascii', 'ascii code', 'ascii码', '码点', '编码', '解码'],
  modes: ['encode', 'decode'],
  exampleInput: 'Hello World',
} satisfies ToolDefinition;
