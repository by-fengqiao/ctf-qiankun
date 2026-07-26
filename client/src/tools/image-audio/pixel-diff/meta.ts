import type { ToolDefinition } from '../../types';
export default {
  id: 'pixel-diff',
  name: '像素差异对比',
  category: 'image-audio',
  group: '图像分析',
  keywords: ['pixel', 'diff', 'compare', '差异', '对比'],
  modes: ['analyze'],
  exampleInput: 'FF0000 00FF00 0000FF\n---\nFF0000 00FF00 FFFFFF',
} satisfies ToolDefinition;
