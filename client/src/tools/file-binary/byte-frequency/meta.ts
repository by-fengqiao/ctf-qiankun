import type { ToolDefinition } from '../../types';
export default {
  id: 'byte-frequency',
  name: '字节频率统计',
  category: 'file-binary',
  group: '字节操作',
  keywords: ['byte', 'frequency', 'histogram', '统计', '频率', '直方图'],
  modes: ['analyze'],
  exampleInput: 'Hello World',
} satisfies ToolDefinition;
