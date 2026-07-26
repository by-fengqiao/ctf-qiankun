import type { ToolDefinition } from '../../types';
export default {
  id: 'ascii-view',
  name: 'ASCII查看',
  category: 'file-binary',
  group: '文本/编码',
  keywords: ['ascii', 'view', '字符', '可打印', 'printable'],
  modes: ['analyze'],
  hasFileInput: true,
  exampleInput: 'Hello World',
} satisfies ToolDefinition;
