import type { ToolDefinition } from '../../types';

export default {
  id: 'duplicate-finder',
  name: '重复查找',
  category: 'text-processing',
  group: '操作',
  keywords: ['重复查找', '重复行', '重复词', 'duplicate', 'dedup find'],
  modes: ['analyze'],
  exampleInput: 'apple\nbanana\napple\ncherry\nbanana',
} satisfies ToolDefinition;
