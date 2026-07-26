import type { ToolDefinition } from '../../types';
export default {
  id: 'byte-replace',
  name: '字节替换',
  category: 'file-binary',
  group: '字节操作',
  keywords: ['byte', 'replace', 'substitute', '替换', 'hex'],
  modes: ['analyze'],
  hasFileInput: true,
  exampleInput: '48656c6c6f',
  defaultParams: { findHex: '', replaceHex: '' },
} satisfies ToolDefinition;
