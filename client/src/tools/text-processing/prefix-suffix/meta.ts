import type { ToolDefinition } from '../../types';

export default {
  id: 'prefix-suffix',
  name: '前后缀添加',
  category: 'text-processing',
  group: '操作',
  keywords: ['前后缀', '前缀', '后缀', 'prefix', 'suffix', '批量添加'],
  modes: ['encode', 'decode'],
  exampleInput: 'line1\nline2\nline3',
} satisfies ToolDefinition;
