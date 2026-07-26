import type { ToolDefinition } from '../../types';

export default {
  id: 'dotnet-parser',
  name: '.NET程序集解析',
  category: 'pwn-reverse',
  group: '文件解析',
  keywords: ['dotnet', 'cil', 'msil', 'pe', 'clr', '程序集', 'assembly'],
  modes: ['execute'],
  hasFileInput: true,
} satisfies ToolDefinition;
