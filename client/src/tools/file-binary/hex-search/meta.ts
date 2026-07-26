import type { ToolDefinition } from '../../types';
export default {
  id: 'hex-search',
  name: 'Hex搜索',
  category: 'file-binary',
  group: 'Hex/Binary',
  keywords: ['hex', 'search', 'pattern', '查找', '搜索', '十六进制'],
  modes: ['analyze'],
  hasFileInput: true,
  exampleInput: 'sample text',
  defaultParams: { pattern: '' },
} satisfies ToolDefinition;
