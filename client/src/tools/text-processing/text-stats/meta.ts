import type { ToolDefinition } from '../../types';

export default {
  id: 'text-stats',
  name: '文本统计',
  category: 'text-processing',
  group: '分析',
  keywords: ['统计', '字数', '行数', '字符数', 'word count', 'stats', 'text statistics'],
  modes: ['analyze'],
  exampleInput: 'Hello World!\nThis is a test sentence.\nWith multiple lines.',
} satisfies ToolDefinition;
