import type { ToolDefinition } from '../../types';

export default {
  id: 'cron-parse',
  name: 'Cron 表达式解析',
  category: 'web-network',
  group: '其他',
  keywords: ['cron', 'crontab', '定时', 'schedule', '表达式', '解析'],
  modes: ['analyze'],
  exampleInput: '0 9 * * 1-5',
} satisfies ToolDefinition;
