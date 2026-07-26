import type { ToolDefinition } from '../../types';

export default {
  id: 'text-sort',
  name: '文本排序',
  category: 'text-processing',
  group: '操作',
  keywords: ['文本排序', '行排序', 'sort lines', 'alphabetical'],
  modes: ['analyze'],
  exampleInput: 'banana\napple\ncherry\ndate',
} satisfies ToolDefinition;
