import type { ToolDefinition } from '../../types';
export default {
  id: 'google-dork',
  name: 'Google Dork 生成器',
  description: '根据目标和意图生成 Google 高级搜索 (Dork) 语句',
  category: 'osint',
  group: '社交/人',
  keywords: ['google', 'dork', 'ghdb', '搜索语法', 'site', 'inurl', 'intitle', 'filetype', 'intext'],
  modes: ['generate'],
  hasFileInput: false,
  exampleInput: 'example.com',
  defaultParams: { target_type: 'domain', intent: 'admin' },
} satisfies ToolDefinition;
