import type { ToolDefinition } from '../../types';

export default {
  id: 'ipv6-expand-compress',
  name: 'IPv6 展开/压缩',
  category: 'web-network',
  group: 'IP/DNS',
  keywords: ['ipv6', 'expand', 'compress', '展开', '压缩', 'address'],
  modes: ['analyze'],
  exampleInput: '2001:db8::1:0:0:1',
} satisfies ToolDefinition;
