import type { ToolDefinition } from '../../types';

export default {
  id: 'got-plt-calc',
  name: 'GOT/PLT计算器',
  description: '解析 ELF 的 .plt 与 .got.plt，映射函数名到 PLT/GOT 地址',
  category: 'pwn-reverse',
  group: '辅助',
  keywords: ['got', 'plt', 'got.plt', '延迟绑定', 'lazy binding', '函数地址', 'elf'],
  modes: ['analyze'],
  hasFileInput: true,
  exampleInput: '7f454c46...',
} satisfies ToolDefinition;
