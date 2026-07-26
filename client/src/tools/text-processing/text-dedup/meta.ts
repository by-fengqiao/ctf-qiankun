import type { ToolDefinition } from '../../types';

export default {
  id: 'text-dedup',
  name: '去重',
  category: 'text-processing',
  group: '操作',
  keywords: ['去重', '删除重复行', 'dedup', 'unique lines'],
  modes: ['analyze'],
  exampleInput: 'apple\nbanana\napple\ncherry\nbanana',
} satisfies ToolDefinition;
