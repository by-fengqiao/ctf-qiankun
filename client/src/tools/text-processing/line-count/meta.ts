import type { ToolDefinition } from '../../types';

export default {
  id: 'line-count',
  name: '行数统计',
  category: 'text-processing',
  group: '操作',
  keywords: ['行数统计', '空行', '非空行', 'line count', 'empty lines'],
  modes: ['analyze'],
  exampleInput: 'Line 1\n\nLine 3\nLine 4\n\n',
} satisfies ToolDefinition;
