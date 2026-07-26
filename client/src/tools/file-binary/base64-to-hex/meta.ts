import type { ToolDefinition } from '../../types';
export default {
  id: 'base64-to-hex',
  name: 'Base64转Hex',
  category: 'file-binary',
  group: 'Hex/Binary',
  keywords: ['hex', 'base64', 'decode', 'Base64', '转十六进制'],
  modes: ['decode'],
  exampleInput: 'SGVsbG8gV29ybGQ=',
} satisfies ToolDefinition;
