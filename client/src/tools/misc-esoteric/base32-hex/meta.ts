import type { ToolDefinition } from '../../types';

export default {
  id: 'base32-hex',
  name: 'Base32Hex 编码',
  category: 'misc-esoteric',
  group: '密码/编码',
  keywords: ['base32hex', 'base32', 'hex', 'rfc4648', '编码', 'encode', 'decode'],
  modes: ['encode', 'decode'],
  exampleInput: 'Hello',
  modeOptions: [
    { value: 'encode', label: '编码' },
    { value: 'decode', label: '解码' },
  ],
} satisfies ToolDefinition;
