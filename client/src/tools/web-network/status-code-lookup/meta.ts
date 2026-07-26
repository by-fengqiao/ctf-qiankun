import type { ToolDefinition } from '../../types';

export default {
  id: 'status-code-lookup',
  name: 'HTTP 状态码查询',
  category: 'web-network',
  group: 'HTTP',
  keywords: ['http', 'status', 'code', 'lookup', 'response'],
  modes: ['analyze'],
  exampleInput: '404',
  defaultParams: { code: '' },
} satisfies ToolDefinition;
