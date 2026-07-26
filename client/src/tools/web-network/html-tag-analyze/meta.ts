import type { ToolDefinition } from '../../types';

export default {
  id: 'html-tag-analyze',
  name: 'HTML 标签分析',
  category: 'web-network',
  group: '其他',
  keywords: ['html', 'tag', '标签', 'attribute', '属性', 'analyze'],
  modes: ['analyze'],
  exampleInput: '<div class="container" id="main"><p>text</p><img src="x.png" alt="img"/></div>',
} satisfies ToolDefinition;
