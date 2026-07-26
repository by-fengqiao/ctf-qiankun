import type { ToolDefinition } from '../../types';

export default {
  id: 'memory-strings',
  name: '内存镜像字符串提取',
  description: '从内存镜像 (.raw/.dmp) 中提取可打印字符串并分类（URL/邮箱/IP/路径/注册表/密码/Flag）',
  category: 'forensics',
  group: '磁盘/文件',
  keywords: ['内存', 'strings', 'string extraction', 'memory dump', 'raw', 'dmp', 'forensics', '取证', '密码提取'],
  modes: ['extract'],
  hasFileInput: true,
  exampleInput: '4d5a90000300000004000000ffff0000...',
} satisfies ToolDefinition;
