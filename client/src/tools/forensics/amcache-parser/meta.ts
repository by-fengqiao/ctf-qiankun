import type { ToolDefinition } from '../../types';

export default {
  id: 'amcache-parser',
  name: 'Amcache.hve解析',
  description: '解析 Amcache.hve 注册表蜂巢，提取 ApplicationFile 条目（程序名、公司、版本、大小、SHA1），生成应用程序清单表',
  category: 'forensics',
  group: 'Windows',
  keywords: ['amcache', 'hve', '注册表蜂巢', 'regf', '应用程序清单', '程序执行记录', 'forensics', '取证'],
  modes: ['analyze'],
  hasFileInput: true,
  exampleInput: '72656766',
} satisfies ToolDefinition;
