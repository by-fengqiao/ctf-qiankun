import type { ToolDefinition } from '../../types';
export default {
  id: 'file-size',
  name: '文件大小',
  category: 'file-binary',
  group: '文件分析',
  keywords: ['size', 'bytes', 'kb', 'mb', '文件大小', '容量'],
  modes: ['analyze'],
  hasFileInput: true,
  exampleInput: 'sample text or drag a file',
} satisfies ToolDefinition;
