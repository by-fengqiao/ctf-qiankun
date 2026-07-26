import type { ToolDefinition } from '../../types';

export default {
  id: 'http-date-convert',
  name: 'HTTP 日期转换',
  category: 'web-network',
  group: 'HTTP',
  keywords: ['http', 'date', 'rfc1123', 'timestamp', '日期', '转换'],
  modes: ['analyze'],
  exampleInput: 'Wed, 21 Oct 2025 07:28:00 GMT',
} satisfies ToolDefinition;
