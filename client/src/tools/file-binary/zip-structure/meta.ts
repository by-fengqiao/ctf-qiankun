import type { ToolDefinition } from '../../types';
export default {
  id: 'zip-structure',
  name: 'ZIP结构解析',
  category: 'file-binary',
  group: '文件格式',
  keywords: ['zip', 'archive', 'structure', '压缩包', 'ZIP', '结构'],
  modes: ['analyze'],
  exampleInput: '504b0304140000000800000000000000000000000000000000000000000',
} satisfies ToolDefinition;
