import type { ToolDefinition } from '../../types';

export default {
  id: 'ole-parser',
  name: 'OLE/Office文件解析',
  description: '解析 OLE2 复合文档（.doc/.xls/.ppt），提取目录结构、扇区链、流数据，检测 VBA 宏与嵌入对象',
  category: 'forensics',
  group: '文档',
  keywords: ['ole', 'compound', 'doc', 'xls', 'ppt', 'vba', 'macro', 'office', 'forensics', '取证', '复合文档'],
  modes: ['analyze'],
  hasFileInput: true,
  exampleInput: 'D0CF11E0A1B11AE1...',
} satisfies ToolDefinition;
