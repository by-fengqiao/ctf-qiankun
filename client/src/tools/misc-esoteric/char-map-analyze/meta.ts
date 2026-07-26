import type { ToolDefinition } from '../../types';

export default {
  id: 'char-map-analyze',
  name: '字符映射分析',
  category: 'misc-esoteric',
  group: '其他',
  keywords: ['char', 'map', 'analyze', '字符', '映射', '分析', 'unicode', 'ascii', '码表'],
  modes: ['analyze'],
  exampleInput: 'Hello',
} satisfies ToolDefinition;
