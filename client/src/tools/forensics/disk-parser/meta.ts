import type { ToolDefinition } from '../../types';

export default {
  id: 'disk-parser',
  name: '磁盘镜像分区解析',
  description: '解析磁盘镜像 MBR/GPT 分区表，提取分区起始/结束/类型/大小/活动标志',
  category: 'forensics',
  group: '磁盘/文件',
  keywords: ['磁盘', 'disk', 'mbr', 'gpt', 'partition', '分区表', 'img', 'dd', 'forensics', '取证'],
  modes: ['analyze'],
  hasFileInput: true,
  exampleInput: 'eb58904d5a9000...0001be00...',
} satisfies ToolDefinition;
