import type { ToolDefinition } from '../../types';

export default {
  id: 'text-entropy',
  name: '文本熵计算',
  category: 'text-processing',
  group: '分析',
  keywords: ['熵', 'entropy', 'shannon', '香农熵', '信息熵'],
  modes: ['analyze'],
  exampleInput: 'Hello World',
} satisfies ToolDefinition;
