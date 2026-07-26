import type { ToolDefinition } from '../../types';

export default {
  id: 'rop-helper',
  name: 'ROP链构造辅助',
  description: '辅助构造 execve / ret2libc / 自定义 ROP 链，生成栈布局表与 hex',
  category: 'pwn-reverse',
  group: '利用构造',
  keywords: ['rop', 'rop链', 'ret2libc', 'execve', 'gadget', '栈布局', 'return oriented programming'],
  modes: ['execute'],
  modeOptions: [
    { value: 'execve', label: 'execve链' },
    { value: 'ret2libc', label: 'ret2libc' },
    { value: 'custom', label: '自定义' },
  ],
  exampleInput: '0x4011a0 | pop rdi; ret\n0x401090 | ret\n0x4011b0 | pop rsi; pop r15; ret\n0x4011c0 | pop rdx; ret\n0x4011d0 | syscall',
} satisfies ToolDefinition;
