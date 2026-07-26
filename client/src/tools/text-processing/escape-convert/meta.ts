import type { ToolDefinition } from '../../types';

export default {
  id: 'escape-convert',
  name: '转义/反转义',
  category: 'text-processing',
  group: '转换',
  keywords: ['转义', '反转义', 'escape', 'unescape', '反斜杠', 'backslash', '字符串转义'],
  modes: ['analyze'],
  exampleInput: 'Hello\\nWorld\\t"quoted"',
} satisfies ToolDefinition;
