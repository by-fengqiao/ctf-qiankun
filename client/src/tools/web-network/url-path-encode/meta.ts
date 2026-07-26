import type { ToolDefinition } from '../../types';

export default {
  id: 'url-path-encode',
  name: 'URL 路径编解码',
  category: 'web-network',
  group: 'URL',
  keywords: ['url', 'path', 'encode', 'decode', 'percent'],
  modes: ['encode', 'decode'],
  exampleInput: '/path/with spaces/特殊字符',
} satisfies ToolDefinition;
