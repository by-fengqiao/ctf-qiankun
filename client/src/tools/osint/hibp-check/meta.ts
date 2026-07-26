import type { ToolDefinition } from '../../types';
export default {
  id: 'hibp-check',
  name: '泄露查询',
  description: '生成 HIBP/DeHashed/LeakCheck 查询链接，本地常见密码比对',
  category: 'osint',
  group: '社交/人',
  keywords: ['hibp', 'leak', 'breach', '泄露', '密码', 'dehashed', 'haveibeenpwned', '撞库'],
  modes: ['analyze'],
  hasFileInput: false,
  exampleInput: 'user@example.com',
} satisfies ToolDefinition;
