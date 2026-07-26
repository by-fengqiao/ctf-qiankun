import type { ToolDefinition } from '../../types';

export default {
  id: 'url-parse',
  name: 'URL 解析',
  category: 'web-network',
  group: 'URL',
  keywords: ['url', 'parse', 'protocol', 'host', 'path', 'query'],
  modes: ['analyze'],
  exampleInput: 'https://user:pass@example.com:8080/path/to/page?key=value#fragment',
} satisfies ToolDefinition;
