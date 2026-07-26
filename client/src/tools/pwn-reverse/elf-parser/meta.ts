import type { ToolDefinition } from '../../types';

export default {
  id: 'elf-parser',
  name: 'ELF文件解析',
  description: '解析 ELF 文件头、程序头表、节区头表与动态段信息',
  category: 'pwn-reverse',
  group: '文件解析',
  keywords: ['elf', 'elf文件', '可执行链接格式', 'linux', '程序头', '节区头', '动态段', 'executable'],
  modes: ['analyze'],
  hasFileInput: true,
  exampleInput: '7f454c46...',
} satisfies ToolDefinition;
