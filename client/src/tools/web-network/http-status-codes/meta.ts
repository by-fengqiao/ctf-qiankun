import type { ToolDefinition } from '../../types';

export default {
  id: 'http-status-codes',
  name: 'HTTP 状态码查询',
  category: 'web-network',
  group: 'HTTP',
  keywords: ['http', 'status', 'code', '响应码', '状态码'],
  modes: ['analyze'],
  exampleInput: '404',
} satisfies ToolDefinition;
