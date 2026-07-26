import type { ToolDefinition } from '../../types';

export default {
  id: 'cidr-calc',
  name: 'CIDR 计算器',
  category: 'web-network',
  group: 'IP/DNS',
  keywords: ['cidr', 'subnet', 'mask', 'range', 'network'],
  modes: ['analyze'],
  exampleInput: '10.0.0.0/16',
} satisfies ToolDefinition;
