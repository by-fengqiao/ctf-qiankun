import type { ToolDefinition } from '../../types';

export default {
  id: 'roman-numeral',
  name: '罗马数字',
  category: 'encoding',
  group: '其他',
  keywords: ['roman', 'numeral', '罗马数字', '编码', '解码'],
  modes: ['encode', 'decode'],
  exampleInput: '2024',
} satisfies ToolDefinition;
