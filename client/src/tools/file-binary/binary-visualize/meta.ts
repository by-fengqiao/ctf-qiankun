import type { ToolDefinition } from '../../types';
export default {
  id: 'binary-visualize',
  name: '二进制可视化',
  category: 'file-binary',
  group: 'Hex/Binary',
  keywords: ['binary', 'visualize', 'grid', '可视化', '二进制', '网格'],
  modes: ['analyze'],
  exampleInput: 'Hello',
} satisfies ToolDefinition;
