import type { ToolDefinition } from '../../types';
export default {
  id: 'hex-to-text',
  name: 'Hex转文本',
  category: 'file-binary',
  group: 'Hex/Binary',
  keywords: ['hex', 'text', 'decode', '十六进制', '转文本'],
  modes: ['decode'],
  exampleInput: '48656c6c6f20576f726c64',
} satisfies ToolDefinition;
