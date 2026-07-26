import type { ToolDefinition } from '../../types';

export default {
  id: 'mac-address-convert',
  name: 'MAC 地址转换',
  category: 'web-network',
  group: 'IP/DNS',
  keywords: ['mac', 'address', 'convert', 'colon', 'hyphen', 'dot'],
  modes: ['analyze'],
  exampleInput: '00:1A:2B:3C:4D:5E',
} satisfies ToolDefinition;
