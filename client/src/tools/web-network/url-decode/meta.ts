import type { ToolDefinition } from '../../types';

export default {
  id: 'url-decode',
  name: 'URL 解码',
  category: 'web-network',
  group: 'URL',
  keywords: ['url', 'decode', 'percent', 'uri'],
  modes: ['decode'],
  exampleInput: 'https%3A%2F%2Fexample.com%2Fpath%3Fq%3Dhello%20world',
} satisfies ToolDefinition;
