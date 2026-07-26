import type { ToolDefinition } from '../../types';

export default {
  id: 'mac-vendor',
  name: 'MAC 厂商查询',
  category: 'web-network',
  group: 'IP/DNS',
  keywords: ['mac', 'vendor', 'oui', '厂商', '查询', 'vendor'],
  modes: ['analyze'],
  exampleInput: '00:1A:2B',
} satisfies ToolDefinition;
