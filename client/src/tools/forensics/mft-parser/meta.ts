import type { ToolDefinition } from '../../types';

export default {
  id: 'mft-parser',
  name: '$MFT解析',
  description: '解析 NTFS MFT 记录，提取文件名、大小、MACE时间戳和属性标志',
  category: 'forensics',
  group: '磁盘/文件',
  keywords: ['mft', 'ntfs', 'master file table', 'FILE记录', 'MACE时间戳', 'forensics', '取证'],
  modes: ['analyze'],
  hasFileInput: true,
  exampleInput: '46494C45300003004D5A905E00000000...',
} satisfies ToolDefinition;
