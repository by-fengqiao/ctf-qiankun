import type { ToolDefinition } from '../../types';
export default {
  id: 'data-uri-to-file',
  name: 'Data URI解析',
  category: 'file-binary',
  group: '文本/编码',
  keywords: ['data', 'uri', 'datauri', 'data url', 'Data URI', '解析'],
  modes: ['analyze'],
  exampleInput: 'data:text/plain;base64,SGVsbG8gV29ybGQ=',
} satisfies ToolDefinition;
