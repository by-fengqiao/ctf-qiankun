import type { ToolDefinition } from '../../types';

export default {
  id: 'utf16-hex',
  name: 'UTF-16 Hex',
  category: 'encoding',
  group: 'URL/Unicode',
  keywords: ['utf16', 'utf-16', 'hex', '十六进制', '编码', '解码'],
  modes: ['encode', 'decode'],
  exampleInput: 'Hello World',
} satisfies ToolDefinition;
