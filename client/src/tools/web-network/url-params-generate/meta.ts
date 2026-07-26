import type { ToolDefinition } from '../../types';

export default {
  id: 'url-params-generate',
  name: 'URL 参数生成',
  category: 'web-network',
  group: 'URL',
  keywords: ['url', 'params', 'generate', 'query', 'string'],
  modes: ['generate'],
  exampleInput: 'name=John\nage=30\ncity=Beijing',
} satisfies ToolDefinition;
