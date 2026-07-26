import type { ToolDefinition } from '../../types';

export default {
  id: 'hex-string',
  name: 'Hex String',
  category: 'encoding',
  group: 'Hex/进制',
  keywords: ['hex', 'hex string', '十六进制字符串', 'hex转字符串'],
  modes: ['encode', 'decode'],
  exampleInput: 'Hello World',
} satisfies ToolDefinition;
