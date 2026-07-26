import type { ToolDefinition } from '../../types';
export default {
  id: 'hex-to-base64',
  name: 'Hex转Base64',
  category: 'file-binary',
  group: 'Hex/Binary',
  keywords: ['hex', 'base64', 'encode', '十六进制', '转Base64'],
  modes: ['encode'],
  exampleInput: '48656c6c6f20576f726c64',
} satisfies ToolDefinition;
