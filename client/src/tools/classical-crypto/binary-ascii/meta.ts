import type { ToolDefinition } from '../../types';

export default {
  id: 'binary-ascii',
  name: '二进制 ASCII 转换',
  category: 'classical-crypto',
  group: '编码',
  keywords: ['binary', 'ascii', '二进制', 'binary to text'],
  modes: ['encode', 'decode'],
  exampleInput: 'Hello',
} satisfies ToolDefinition;
