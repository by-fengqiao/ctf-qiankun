import type { ToolDefinition } from '../../types';

export default {
  id: 'content-type-lookup',
  name: 'Content-Type 查询',
  category: 'web-network',
  group: 'HTTP',
  keywords: ['content-type', 'mime', 'lookup', 'http'],
  modes: ['analyze'],
  exampleInput: 'application/json',
} satisfies ToolDefinition;
