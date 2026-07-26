import type { ToolDefinition } from '../../types';

export default {
  id: 'url-query-analyze',
  name: 'URL 查询参数分析',
  category: 'web-network',
  group: 'URL',
  keywords: ['url', 'query', 'params', 'analyze', 'parse'],
  modes: ['analyze'],
  exampleInput: 'name=John&age=30&tags=a&tags=b&active=true',
} satisfies ToolDefinition;
