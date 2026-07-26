import type { ToolDefinition } from '../../types';

export default {
  id: 'jsonp-parse',
  name: 'JSONP 解析',
  category: 'web-network',
  group: 'URL',
  keywords: ['jsonp', 'callback', 'json', 'parse', '解析'],
  modes: ['analyze'],
  exampleInput: 'callback({"name":"test","value":123})',
} satisfies ToolDefinition;
