import type { ToolDefinition } from '../../types';

export default {
  id: 'char-info',
  name: '字符详细信息',
  category: 'text-processing',
  group: '分析',
  keywords: ['字符', 'char', '码点', 'codepoint', '二进制', '八进制', '十六进制', '字符信息'],
  modes: ['analyze'],
  exampleInput: 'ABC123你好',
} satisfies ToolDefinition;
