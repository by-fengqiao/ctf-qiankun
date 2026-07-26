import type { ToolDefinition } from '../../types';
export default {
  id: 'byte-order',
  name: '字节序转换',
  category: 'file-binary',
  group: '字节操作',
  keywords: ['endian', 'byte', 'order', 'big', 'little', '字节序', '端序', '大端', '小端'],
  modes: ['execute'],
  exampleInput: '01020304',
} satisfies ToolDefinition;
