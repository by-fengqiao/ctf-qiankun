import type { ToolDefinition } from '../../types';
export default {
  id: 'string-extract',
  name: '字符串提取',
  category: 'file-binary',
  group: '文本/编码',
  keywords: ['string', 'extract', 'strings', '提取', '可打印'],
  modes: ['analyze'],
  hasFileInput: true,
  exampleInput: 'sample text or drag a binary file',
  defaultParams: { minLength: '4' },
} satisfies ToolDefinition;
