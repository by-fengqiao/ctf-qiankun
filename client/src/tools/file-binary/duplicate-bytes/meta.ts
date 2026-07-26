import type { ToolDefinition } from '../../types';
export default {
  id: 'duplicate-bytes',
  name: '重复字节查找',
  category: 'file-binary',
  group: '字节操作',
  keywords: ['duplicate', 'repeat', '重复', 'pattern', '字节'],
  modes: ['analyze'],
  exampleInput: '41414141424242424241414141',
} satisfies ToolDefinition;
