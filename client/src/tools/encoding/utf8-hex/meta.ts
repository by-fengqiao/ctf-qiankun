import type { ToolDefinition } from '../../types';

export default {
  id: 'utf8-hex',
  name: 'UTF-8 Hex',
  category: 'encoding',
  group: 'URL/Unicode',
  keywords: ['utf8', 'utf-8', 'hex', '十六进制', '编码', '解码'],
  modes: ['encode', 'decode'],
  exampleInput: 'Hello World',
} satisfies ToolDefinition;
