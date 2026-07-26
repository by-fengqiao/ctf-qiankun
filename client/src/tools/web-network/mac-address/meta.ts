import type { ToolDefinition } from '../../types';

export default {
  id: 'mac-address',
  name: 'MAC 地址格式转换',
  category: 'web-network',
  group: 'IP/DNS',
  keywords: ['mac', 'address', '地址', '格式', '转换', 'convert', 'oui'],
  modes: ['analyze'],
  exampleInput: '00:1A:2B:3C:4D:5E',
} satisfies ToolDefinition;
