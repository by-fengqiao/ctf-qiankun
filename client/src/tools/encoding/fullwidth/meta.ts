import type { ToolDefinition } from '../../types';

export default {
  id: 'fullwidth',
  name: '全角/半角',
  category: 'encoding',
  group: '文本变换',
  keywords: ['fullwidth', 'halfwidth', '全角', '半角', '全角半角', '转换'],
  modes: ['generate'],
  exampleInput: 'Hello World 123',
  defaultParams: { type: 'full' },
} satisfies ToolDefinition;
