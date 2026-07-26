import type { ToolDefinition } from '../../types';

export default {
  id: 'http-header-parse',
  name: 'HTTP Header 解析',
  category: 'web-network',
  group: 'HTTP',
  keywords: ['http', 'header', 'parse', 'request', 'response'],
  modes: ['analyze'],
  exampleInput:
    'Content-Type: application/json\nCache-Control: no-cache\nAuthorization: Bearer token123\n',
} satisfies ToolDefinition;
