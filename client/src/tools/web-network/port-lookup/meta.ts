import type { ToolDefinition } from '../../types';

export default {
  id: 'port-lookup',
  name: '端口查询',
  category: 'web-network',
  group: '其他',
  keywords: ['port', 'lookup', 'service', 'protocol'],
  modes: ['analyze'],
  exampleInput: '443',
} satisfies ToolDefinition;
