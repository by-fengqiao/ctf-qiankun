import type { ToolDefinition } from '../../types';

export default {
  id: 'oct-convert',
  name: '八进制转换',
  category: 'encoding',
  group: 'Hex/进制',
  keywords: ['octal', 'oct', '八进制', '编码', '解码'],
  modes: ['encode', 'decode'],
  exampleInput: 'Hello',
} satisfies ToolDefinition;
