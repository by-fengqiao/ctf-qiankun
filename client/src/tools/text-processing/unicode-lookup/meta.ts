import type { ToolDefinition } from '../../types';

export default {
  id: 'unicode-lookup',
  name: 'Unicode 查询',
  category: 'text-processing',
  group: '分析',
  keywords: ['unicode', '码点', 'codepoint', '字符信息', '编码', 'utf-8', 'utf-16'],
  modes: ['analyze'],
  exampleInput: 'Hello 世界',
} satisfies ToolDefinition;
