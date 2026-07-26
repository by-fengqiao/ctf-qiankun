import type { ToolDefinition } from '../../types';
export default {
  id: 'file-type-id',
  name: '文件类型识别',
  category: 'file-binary',
  group: '文件分析',
  keywords: ['file', 'type', 'identify', 'magic', '签名', '格式'],
  modes: ['analyze'],
  hasFileInput: true,
  exampleInput: 'sample text or drag a file',
} satisfies ToolDefinition;
