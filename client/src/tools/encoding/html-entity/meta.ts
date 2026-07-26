import type { ToolDefinition } from '../../types';

export default {
  id: 'html-entity',
  name: 'HTML 实体编码',
  category: 'encoding',
  group: 'URL/Unicode',
  keywords: ['html', 'entity', 'html实体', 'html编码', '转义'],
  modes: ['encode', 'decode'],
  exampleInput: '<div class="hello">&"Hello"</div>',
} satisfies ToolDefinition;
