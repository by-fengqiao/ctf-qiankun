import type { ToolDefinition } from '../../types';
export default {
  id: 'base64-to-file',
  name: 'Base64转文本',
  category: 'file-binary',
  group: 'Hex/Binary',
  keywords: ['base64', 'decode', 'text', 'Base64', '转文本'],
  modes: ['decode'],
  exampleInput: 'SGVsbG8gV29ybGQ=',
} satisfies ToolDefinition;
