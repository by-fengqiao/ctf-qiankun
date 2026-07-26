import type { ToolDefinition } from '../../types';

export default {
  id: 'bin-convert',
  name: '二进制转换',
  category: 'encoding',
  group: 'Hex/进制',
  keywords: ['binary', 'bin', '二进制', '编码', '解码'],
  modes: ['encode', 'decode'],
  exampleInput: 'Hello',
} satisfies ToolDefinition;
