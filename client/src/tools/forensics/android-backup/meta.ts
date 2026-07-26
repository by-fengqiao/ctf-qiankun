import type { ToolDefinition } from '../../types';

export default {
  id: 'android-backup',
  name: 'Android备份解析',
  description: '解析 Android .ab 备份文件头部（版本/压缩/加密），检测 zlib 压缩流与文件列表',
  category: 'forensics',
  group: '移动/链',
  keywords: ['android', 'backup', 'ab', 'adb', 'zlib', 'deflate', 'forensics', '取证', '备份'],
  modes: ['analyze'],
  hasFileInput: true,
  exampleInput: '414E44524F4944204241434B55500A...',
} satisfies ToolDefinition;
