import type { ToolDefinition } from '../../types';

export default {
  id: 'registry-parser',
  name: 'Windows注册表解析',
  description: '解析 Windows 注册表 hive 文件 (NTUSER.DAT/SYSTEM/SOFTWARE)，提取键值树结构',
  category: 'forensics',
  group: 'Windows',
  keywords: ['注册表', 'registry', 'regf', 'ntuser', 'system', 'software', 'hive', 'nk', 'vk', 'forensics', '取证'],
  modes: ['analyze'],
  hasFileInput: true,
  exampleInput: '7265676600000000...',
} satisfies ToolDefinition;
