import type { ToolDefinition } from '../../types';

export default {
  id: 'char-frequency',
  name: '字符频率统计',
  category: 'text-processing',
  group: '分析',
  keywords: ['字符频率', '字符统计', 'char frequency', 'character count'],
  modes: ['analyze'],
  exampleInput: 'aabbbcccc',
} satisfies ToolDefinition;
