import type { ToolDefinition } from '../../types';

export default {
  id: 'mime-query',
  name: 'MIME 类型查询',
  category: 'web-network',
  group: '其他',
  keywords: ['mime', 'content-type', '类型', 'extension', '扩展名', '查询'],
  modes: ['analyze'],
  exampleInput: 'pdf',
} satisfies ToolDefinition;
