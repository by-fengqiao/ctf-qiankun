import type { ToolDefinition } from '../../types';

export default {
  id: 'dns-format',
  name: 'DNS 记录解析',
  category: 'web-network',
  group: 'IP/DNS',
  keywords: ['dns', 'record', 'a', 'aaaa', 'cname', 'mx', 'txt', '解析'],
  modes: ['analyze'],
  exampleInput: 'example.com.  3600  IN  A  93.184.216.34',
} satisfies ToolDefinition;
