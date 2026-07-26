import type { ToolDefinition } from '../../types';

export default {
  id: 'iso8601-format',
  name: 'ISO 8601 日期格式',
  category: 'web-network',
  group: '其他',
  keywords: ['iso', 'iso8601', 'date', '日期', '格式', 'format'],
  modes: ['analyze'],
  exampleInput: '2025-07-24T15:30:00+08:00',
} satisfies ToolDefinition;
