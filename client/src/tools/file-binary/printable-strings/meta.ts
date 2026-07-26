import type { ToolDefinition } from '../../types';
export default {
  id: 'printable-strings',
  name: '可打印字符串提取',
  category: 'file-binary',
  group: '文本/编码',
  keywords: ['strings', 'printable', '可打印', '字符串', '提取', 'strings'],
  modes: ['analyze'],
  hasFileInput: true,
  exampleInput: '48656c6c6f20576f726c6400416c696365',
} satisfies ToolDefinition;
