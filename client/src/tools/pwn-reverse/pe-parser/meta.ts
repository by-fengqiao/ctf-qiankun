import type { ToolDefinition } from '../../types';

export default {
  id: 'pe-parser',
  name: 'PE文件解析',
  description: '解析 PE/COFF 文件头、节区表、导入表与导出表',
  category: 'pwn-reverse',
  group: '文件解析',
  keywords: ['pe', 'pe文件', 'windows', '可移植可执行', 'coff', '导入表', '导出表', 'executable'],
  modes: ['analyze'],
  hasFileInput: true,
  exampleInput: '4d5a9000...',
} satisfies ToolDefinition;
