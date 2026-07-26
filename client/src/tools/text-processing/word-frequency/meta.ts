import type { ToolDefinition } from '../../types';

export default {
  id: 'word-frequency',
  name: '词频统计',
  category: 'text-processing',
  group: '分析',
  keywords: ['词频统计', '单词频率', 'word frequency', 'word count'],
  modes: ['analyze'],
  exampleInput: 'the quick brown fox the lazy dog the end',
} satisfies ToolDefinition;
