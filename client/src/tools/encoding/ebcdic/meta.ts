import type { ToolDefinition } from '../../types';

export default {
  id: 'ebcdic',
  name: 'EBCDIC',
  category: 'encoding',
  group: '其他',
  keywords: ['ebcdic', 'ibm', 'mainframe', '编码', '解码'],
  modes: ['encode', 'decode'],
  exampleInput: 'Hello World',
} satisfies ToolDefinition;
