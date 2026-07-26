import type { ToolDefinition } from '../../types';
export default {
  id: 'text-encoding-detect',
  name: '文本编码检测',
  category: 'file-binary',
  group: '文本/编码',
  keywords: ['encoding', 'detect', 'bom', 'utf8', 'utf16', '编码', '检测', 'BOM'],
  modes: ['analyze'],
  exampleInput: 'efbbbf48656c6c6f',
} satisfies ToolDefinition;
