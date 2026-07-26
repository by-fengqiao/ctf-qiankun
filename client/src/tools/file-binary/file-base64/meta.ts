import type { ToolDefinition } from '../../types';
export default {
  id: 'file-base64',
  name: '文件转Base64',
  category: 'file-binary',
  group: '文件分析',
  keywords: ['base64', 'encode', '文件', 'convert', '转换'],
  modes: ['analyze'],
  hasFileInput: true,
  exampleInput: 'sample text or drag a file',
} satisfies ToolDefinition;
