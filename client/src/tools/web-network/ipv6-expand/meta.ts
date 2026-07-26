import type { ToolDefinition } from '../../types';

export default {
  id: 'ipv6-expand',
  name: 'IPv6 展开压缩',
  category: 'web-network',
  group: 'IP/DNS',
  keywords: ['ipv6', 'expand', 'compress', 'address'],
  modes: ['analyze'],
  exampleInput: '2001:db8::1:0:0:1',
} satisfies ToolDefinition;
