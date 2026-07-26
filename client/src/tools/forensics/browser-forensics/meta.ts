import type { ToolDefinition } from '../../types';

export default {
  id: 'browser-forensics',
  name: '浏览器数据解析',
  description: '解析浏览器 SQLite 数据库 (History/Cookies)，提取访问历史、Cookie (URL/时间/值)',
  category: 'forensics',
  group: '文档',
  keywords: ['浏览器', 'browser', 'sqlite', 'history', 'cookies', 'chrome', 'firefox', 'forensics', '取证', '访问历史'],
  modes: ['analyze'],
  hasFileInput: true,
  exampleInput: '53514c69746520666f726d6174203300...',
} satisfies ToolDefinition;
