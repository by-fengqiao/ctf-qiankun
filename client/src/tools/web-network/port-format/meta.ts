import type { ToolDefinition } from '../../types';

export default {
  id: 'port-format',
  name: '端口号格式化',
  category: 'web-network',
  group: '其他',
  keywords: ['port', '端口', 'hex', 'binary', '格式', 'format'],
  modes: ['analyze'],
  exampleInput: '8080',
} satisfies ToolDefinition;
