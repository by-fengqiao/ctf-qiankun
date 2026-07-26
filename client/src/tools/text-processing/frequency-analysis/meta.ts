import type { ToolDefinition } from '../../types';
export default {
  id: 'frequency-analysis',
  name: '字符频率统计',
  description: '统计输入文本中各字符的出现次数与占比',
  category: 'text-processing',
  group: '分析',
  keywords: ['frequency', '频率分析', '字符频率', '统计'],
  modes: ['analyze'],
  exampleInput: 'Hello World',
} satisfies ToolDefinition;
