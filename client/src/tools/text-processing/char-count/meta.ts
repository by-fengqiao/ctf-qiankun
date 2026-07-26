import type { ToolDefinition } from '../../types';

export default {
  id: 'char-count',
  name: '字符统计',
  category: 'text-processing',
  group: '分析',
  keywords: ['字符统计', '字数统计', '行数', '句子数', 'char count', 'word count'],
  modes: ['analyze'],
  exampleInput: 'Hello World!\nThis is a test sentence.',
} satisfies ToolDefinition;
