import type { ToolDefinition } from '../../types';

export default {
  id: 'ipv4-subnet-calc',
  name: 'IPv4 子网计算器',
  category: 'web-network',
  group: 'IP/DNS',
  keywords: ['ipv4', 'subnet', 'mask', 'broadcast', 'network', 'cidr'],
  modes: ['analyze'],
  exampleInput: '192.168.1.0/24',
} satisfies ToolDefinition;
