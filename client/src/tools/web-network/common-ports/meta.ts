import type { ToolDefinition } from '../../types';

export default {
  id: 'common-ports',
  name: '常用端口查询',
  category: 'web-network',
  group: '其他',
  keywords: ['port', '端口', 'service', '服务', 'common', '常用'],
  modes: ['analyze'],
  exampleInput: '443',
} satisfies ToolDefinition;
