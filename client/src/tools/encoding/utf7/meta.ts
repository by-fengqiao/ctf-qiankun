import type { ToolDefinition } from '../../types';

export default {
  id: 'utf7',
  name: 'UTF-7',
  category: 'encoding',
  group: 'URL/Unicode',
  keywords: ['utf7', 'utf-7', '编码', '解码'],
  modes: ['encode', 'decode'],
  exampleInput: 'Hello World 你好',
} satisfies ToolDefinition;
