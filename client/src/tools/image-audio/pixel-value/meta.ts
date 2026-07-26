import type { ToolDefinition } from '../../types';
export default {
  id: 'pixel-value',
  name: '像素值读取',
  category: 'image-audio',
  group: '图像分析',
  keywords: ['pixel', 'value', 'coordinate', '像素', '坐标'],
  modes: ['analyze'],
  hasFileInput: true,
  exampleInput: '拖入图片文件',
  defaultParams: { x: '0', y: '0' },
} satisfies ToolDefinition;
