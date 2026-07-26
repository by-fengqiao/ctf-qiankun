import type { ToolDefinition } from '../../types';
export default {
  id: 'noise-analysis',
  name: '隐写噪声分析',
  description: 'LSB 噪声分析、卡方检测与样本对分析，检测隐写存在',
  category: 'stego',
  group: '图像',
  keywords: ['noise', 'lsb', 'chi-square', 'steganography', 'detect', '噪声', '卡方', '隐写检测'],
  modes: ['analyze'],
  hasFileInput: true,
  exampleInput: '拖入图片文件',
} satisfies ToolDefinition;
