import type { ToolDefinition } from '../../types';
export default {
  id: 'lsb-check',
  name: 'LSB 隐写检测',
  category: 'image-audio',
  group: '隐写',
  keywords: ['lsb', 'steganography', 'stego', '隐写', '最低有效位'],
  modes: ['analyze'],
  hasFileInput: true,
  exampleInput: '拖入图片文件',
} satisfies ToolDefinition;
