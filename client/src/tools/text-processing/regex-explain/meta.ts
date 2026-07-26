import type { ToolDefinition } from '../../types';

export default {
  id: 'regex-explain',
  name: '正则解释',
  category: 'text-processing',
  group: '生成',
  keywords: ['正则解释', 'regex explain', '正则说明', '理解正则'],
  modes: ['analyze'],
  exampleInput: '\\d{2,4}-[a-zA-Z]+',
} satisfies ToolDefinition;
