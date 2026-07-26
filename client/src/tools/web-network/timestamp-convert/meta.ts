import type { ToolDefinition } from '../../types';

export default {
  id: 'timestamp-convert',
  name: '时间戳转换',
  category: 'web-network',
  group: '其他',
  keywords: ['timestamp', 'unix', '时间戳', 'date', '转换', 'convert'],
  modes: ['analyze'],
  exampleInput: '1719840000',
} satisfies ToolDefinition;
