import type { ToolDefinition } from '../../types';

export default {
  id: 'uuencode',
  name: 'UUencode / Base85 编码',
  description: 'UUencode/Base85 (ASCII85) 编解码',
  category: 'misc',
  group: '杂项',
  keywords: ['uuencode', 'uudecode', 'base85', 'ascii85', 'uu', '编码'],
  modes: ['execute'],
  hasFileInput: false,
  exampleInput: 'Hello, World!',
  defaultParams: { mode: 'uuencode' },
} satisfies ToolDefinition;
