import type { ToolDefinition } from '../../types';

export default {
  id: 'recycle-bin',
  name: '回收站文件解析',
  description: '解析 Windows 回收站 $I 文件（Win10+）与 INFO2（XP）记录，提取删除文件名、原始路径、文件大小与删除时间',
  category: 'forensics',
  group: 'Windows',
  keywords: ['回收站', 'recycle bin', '$I文件', 'INFO2', '文件恢复', '删除时间', 'forensics', '取证'],
  modes: ['analyze'],
  hasFileInput: true,
  exampleInput: '0200000000000000',
} satisfies ToolDefinition;
