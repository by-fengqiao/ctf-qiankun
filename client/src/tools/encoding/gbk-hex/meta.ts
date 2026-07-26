import type { ToolDefinition } from '../../types';

export default {
  id: 'gbk-hex',
  name: 'GBK Hex',
  category: 'encoding',
  group: '其他',
  keywords: ['gbk', 'hex', '十六进制', '中文编码', '编码', '解码'],
  modes: ['encode', 'decode'],
  exampleInput: '你好 World',
} satisfies ToolDefinition;
