import type { ToolDefinition } from '../../types';

export default {
  id: 'random-string',
  name: '随机字符串',
  category: 'text-processing',
  group: '生成',
  keywords: ['随机字符串', 'random string', '生成', 'random'],
  modes: ['generate'],
  exampleInput: '',
} satisfies ToolDefinition;
