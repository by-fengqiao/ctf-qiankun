import type { ToolDefinition } from '../../types';

export default {
  id: 'html-comment-view',
  name: 'HTML 注释提取',
  category: 'web-network',
  group: '其他',
  keywords: ['html', 'comment', '注释', 'extract', '提取'],
  modes: ['analyze'],
  exampleInput: '<div><!-- TODO: fix this --><p>Hello</p><!-- end --></div>',
} satisfies ToolDefinition;
