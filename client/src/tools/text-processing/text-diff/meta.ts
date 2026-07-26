import type { ToolDefinition } from '../../types';

export default {
  id: 'text-diff',
  name: '文本对比',
  category: 'text-processing',
  group: '分析',
  keywords: ['文本对比', '文本差异', 'diff', 'compare', '比较'],
  modes: ['analyze'],
  paramsConfig: [],
  exampleInput: 'apple\nbanana\ncherry',
  defaultParams: { otherText: '' },
} satisfies ToolDefinition;
