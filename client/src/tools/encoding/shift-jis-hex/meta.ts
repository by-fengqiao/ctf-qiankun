import type { ToolDefinition } from '../../types';

export default {
  id: 'shift-jis-hex',
  name: 'Shift-JIS Hex',
  category: 'encoding',
  group: '其他',
  keywords: ['shift-jis', 'shiftjis', 'sjis', 'hex', '十六进制', '日文编码', '编码', '解码'],
  modes: ['encode', 'decode'],
  exampleInput: 'こんにちは World',
} satisfies ToolDefinition;
