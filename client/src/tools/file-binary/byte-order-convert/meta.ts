import type { ToolDefinition } from '../../types';
export default {
  id: 'byte-order-convert',
  name: '字节序转换',
  category: 'file-binary',
  group: '字节操作',
  keywords: ['byte', 'order', 'endian', 'big', 'little', '字节序', '端序'],
  modes: ['analyze'],
  hasFileInput: true,
  exampleInput: '01020304',
  defaultParams: { endian: 'little', size: '32' },
} satisfies ToolDefinition;
