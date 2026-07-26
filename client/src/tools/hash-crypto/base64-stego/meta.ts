import type { ToolDefinition } from '../../types';
export default {
  id: 'base64-stego',
  name: 'Base64 Steganography',
  category: 'hash-crypto',
  group: '其他',
  keywords: ['base64', 'steganography', 'stego', '隐写'],
  modes: ['decode', 'encode'],
  exampleInput: 'SGVsbG8gV29ybGQ=',
} satisfies ToolDefinition;
