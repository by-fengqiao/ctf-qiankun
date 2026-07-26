import type { ToolDefinition } from '../../types';

export default {
  id: 'arm-disasm',
  name: 'ARM反汇编',
  category: 'pwn-reverse',
  group: '汇编',
  keywords: ['arm', 'aarch64', 'thumb', 'disasm', '反汇编', 'arm64'],
  modes: ['execute'],
  defaultParams: { arch: 'ARM64' },
} satisfies ToolDefinition;
