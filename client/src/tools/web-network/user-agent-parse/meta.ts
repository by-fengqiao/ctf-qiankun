import type { ToolDefinition } from '../../types';

export default {
  id: 'user-agent-parse',
  name: 'User-Agent 解析',
  category: 'web-network',
  group: '其他',
  keywords: ['user-agent', 'ua', 'browser', 'os', 'device', 'parse'],
  modes: ['analyze'],
  exampleInput:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
} satisfies ToolDefinition;
