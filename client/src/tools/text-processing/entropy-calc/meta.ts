import type { ToolDefinition } from '../../types';

export default {
  id: 'entropy-calc',
  name: '香农熵计算',
  category: 'text-processing',
  group: '分析',
  keywords: ['熵', 'entropy', 'shannon', '香农熵', '信息熵', 'entropy calculation'],
  modes: ['analyze'],
  exampleInput: 'Hello World',
} satisfies ToolDefinition;
