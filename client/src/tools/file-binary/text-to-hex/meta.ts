import type { ToolDefinition } from '../../types';
export default {
  id: 'text-to-hex',
  name: '文本转Hex',
  category: 'file-binary',
  group: '文本/编码',
  keywords: ['hex', 'text', 'encode', '文本', '转十六进制'],
  modes: ['encode'],
  exampleInput: 'Hello World',
} satisfies ToolDefinition;
