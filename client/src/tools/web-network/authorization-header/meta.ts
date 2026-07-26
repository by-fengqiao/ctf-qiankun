import type { ToolDefinition } from '../../types';

export default {
  id: 'authorization-header',
  name: 'Authorization 头解析',
  category: 'web-network',
  group: 'HTTP',
  keywords: ['authorization', 'header', 'parse', 'basic', 'bearer', 'digest'],
  modes: ['analyze'],
  exampleInput: 'Basic dXNlcjpwYXNzd29yZA==',
} satisfies ToolDefinition;
