import type { ToolDefinition } from '../../types';

export default {
  id: 'newline-convert',
  name: '换行符转换',
  category: 'text-processing',
  group: '转换',
  keywords: ['换行符', 'newline', 'lf', 'crlf', 'cr', '行尾', 'line ending'],
  modes: ['analyze'],
  exampleInput: 'line1\r\nline2\r\nline3',
} satisfies ToolDefinition;
