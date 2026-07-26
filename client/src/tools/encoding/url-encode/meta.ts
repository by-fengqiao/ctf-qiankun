import type { ToolDefinition } from '../../types';

export default {
  id: 'url-encode',
  name: 'URL 编码',
  category: 'encoding',
  group: 'URL/Unicode',
  keywords: ['url', 'uri', 'encode', 'percent', 'url编码', '百分号编码'],
  modes: ['encode', 'decode'],
  exampleInput: 'https://example.com/?q=你好世界',
} satisfies ToolDefinition;
