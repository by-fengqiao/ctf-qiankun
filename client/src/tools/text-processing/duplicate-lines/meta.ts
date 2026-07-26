import type { ToolDefinition } from '../../types';

export default {
  id: 'duplicate-lines',
  name: '重复行查找',
  category: 'text-processing',
  group: '操作',
  keywords: ['重复行', 'duplicate lines', '重复', '去重查找', 'find duplicates'],
  modes: ['analyze'],
  exampleInput: 'apple\nbanana\napple\ncherry\nbanana\napple',
} satisfies ToolDefinition;
