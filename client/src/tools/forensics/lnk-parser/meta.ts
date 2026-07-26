import type { ToolDefinition } from '../../types';

export default {
  id: 'lnk-parser',
  name: 'LNK快捷方式解析',
  description: '解析 Windows LNK 快捷方式文件，提取目标路径、工作目录、参数、时间戳、机器名和卷序列号',
  category: 'forensics',
  group: 'Windows',
  keywords: ['lnk', '快捷方式', 'shortcut', 'shell link', 'PIDL', 'CLSID', 'forensics', '取证'],
  modes: ['analyze'],
  hasFileInput: true,
  exampleInput: '4C0000000114000200000000000000000000C000000000046...',
} satisfies ToolDefinition;
