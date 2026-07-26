import type { ToolDefinition } from '../../types';

export default {
  id: 'ip-convert',
  name: 'IP 格式转换',
  category: 'web-network',
  group: 'IP/DNS',
  keywords: ['ip', 'convert', 'binary', 'hex', 'int', 'dotted'],
  modes: ['analyze'],
  exampleInput: '192.168.1.1',
} satisfies ToolDefinition;
