import type { ToolDefinition } from '../../types';

export default {
  id: 'smart-split',
  name: '智能分割',
  category: 'encoding',
  group: '字符操作',
  keywords: ['split', 'segment', '分割', '切分', '句子', '单词'],
  modes: ['generate'],
  exampleInput: 'Hello World. How are you? I am fine!',
  defaultParams: { type: 'line' },
} satisfies ToolDefinition;
