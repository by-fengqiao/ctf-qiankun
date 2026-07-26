import type { ToolDefinition } from '../../types';
export default {
  id: 'hex-to-string',
  name: 'Hex转字符串',
  category: 'file-binary',
  group: 'Hex/Binary',
  keywords: ['hex', 'string', 'text', 'convert', '十六进制', '转换'],
  modes: ['encode', 'decode'],
  hasFileInput: true,
  exampleInput: '48656c6c6f',
} satisfies ToolDefinition;
