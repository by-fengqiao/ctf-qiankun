import type { ToolDefinition } from '../../types';

export default {
  id: 'big5-hex',
  name: 'Big5 Hex',
  category: 'encoding',
  group: '其他',
  keywords: ['big5', 'big-5', 'hex', '十六进制', '繁体中文', '编码', '解码'],
  modes: ['encode', 'decode'],
  exampleInput: '你好 World',
} satisfies ToolDefinition;
