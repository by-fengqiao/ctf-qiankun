import type { ToolDefinition } from '../../types';

export default {
  id: 'cookie-parse',
  name: 'Cookie 解析',
  category: 'web-network',
  group: 'Cookie',
  keywords: ['cookie', 'parse', 'header', 'http'],
  modes: ['analyze'],
  exampleInput: 'name=John; theme=dark; session=abc123; ',
} satisfies ToolDefinition;
