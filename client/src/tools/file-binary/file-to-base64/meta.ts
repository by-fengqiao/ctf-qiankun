import type { ToolDefinition } from '../../types';
export default {
  id: 'file-to-base64',
  name: '文本转Base64',
  category: 'file-binary',
  group: '文件分析',
  keywords: ['base64', 'encode', 'text', '文本', '转Base64'],
  modes: ['encode'],
  exampleInput: 'Hello World',
} satisfies ToolDefinition;
