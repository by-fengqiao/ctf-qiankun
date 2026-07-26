import type { ToolDefinition } from '../../types';
export default {
  id: 'username-check',
  name: '用户名枚举',
  description: '生成 30+ 平台的用户名存在性查询链接（仅生成链接，不实际请求）',
  category: 'osint',
  group: '社交/人',
  keywords: ['username', 'osint', '枚举', '平台', '社工', 'sherlock', '用户名', 'social'],
  modes: ['generate'],
  hasFileInput: false,
  exampleInput: 'johndoe',
} satisfies ToolDefinition;
