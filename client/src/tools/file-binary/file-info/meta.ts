import type { ToolDefinition } from '../../types';
export default {
  id: 'file-info',
  name: '文件信息',
  category: 'file-binary',
  group: '文件分析',
  keywords: ['info', 'metadata', '文件信息', '属性', 'metadata'],
  modes: ['analyze'],
  hasFileInput: true,
  exampleInput: 'sample text or drag a file',
} satisfies ToolDefinition;
