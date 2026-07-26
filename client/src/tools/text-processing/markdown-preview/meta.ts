import type { ToolDefinition } from '../../types';

export default {
  id: 'markdown-preview',
  name: 'Markdown 预览',
  category: 'text-processing',
  group: '转换',
  keywords: ['markdown', 'md', '预览', 'html', 'markdown to html'],
  modes: ['encode'],
  exampleInput: '# Title\n\nSome **bold** and *italic* text.\n\n- Item 1\n- Item 2',
} satisfies ToolDefinition;
