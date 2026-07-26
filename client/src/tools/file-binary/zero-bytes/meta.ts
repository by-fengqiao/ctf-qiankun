import type { ToolDefinition } from '../../types';
export default {
  id: 'zero-bytes',
  name: '零字节查找',
  category: 'file-binary',
  group: '字节操作',
  keywords: ['zero', 'null', '00', '零字节', '空字节'],
  modes: ['analyze'],
  exampleInput: '480065006c006c006f00',
} satisfies ToolDefinition;
