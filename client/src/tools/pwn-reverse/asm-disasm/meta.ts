import type { ToolDefinition } from '../../types';

export default {
  id: 'asm-disasm',
  name: 'x86汇编反汇编',
  description: 'x86/x64 常见指令汇编与反汇编，支持 mov/push/pop/call/jmp 等指令',
  category: 'pwn-reverse',
  group: '汇编',
  keywords: ['asm', 'assembly', 'x86', 'x64', '汇编', '反汇编', 'disassemble', '机器码', 'opcode'],
  modes: ['execute'],
  modeOptions: [
    { value: 'assemble', label: '汇编' },
    { value: 'disassemble', label: '反汇编' },
  ],
  paramsConfig: [
    {
      name: 'bits',
      label: '位数',
      type: 'select',
      default: '64',
      options: [
        { value: '32', label: '32位' },
        { value: '64', label: '64位' },
      ],
    },
  ],
  exampleInput: 'xor rax, rax',
} satisfies ToolDefinition;
