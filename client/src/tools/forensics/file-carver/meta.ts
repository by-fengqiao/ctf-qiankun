import type { ToolDefinition } from '../../types';

export default {
  id: 'file-carver',
  name: '文件雕刻',
  description: '扫描二进制数据中的文件签名（PNG/JPEG/GIF/PDF/ZIP/GZIP/ELF/PE），提取内嵌文件并生成下载链接',
  category: 'forensics',
  group: '磁盘/文件',
  keywords: ['文件雕刻', 'file carving', 'magic number', '文件签名', '内嵌文件', 'embedded file', '数据恢复', 'forensics'],
  modes: ['analyze'],
  hasFileInput: true,
  exampleInput: '89504E470D0A1A0A0000000D49484452...',
} satisfies ToolDefinition;
