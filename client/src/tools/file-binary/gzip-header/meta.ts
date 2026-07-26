import type { ToolDefinition } from '../../types';
export default {
  id: 'gzip-header',
  name: 'GZIP头解析',
  category: 'file-binary',
  group: '文件格式',
  keywords: ['gzip', 'gz', 'header', 'magic', '压缩', 'GZIP'],
  modes: ['analyze'],
  exampleInput: '1f8b0800000000000003',
} satisfies ToolDefinition;
