import type { ToolDefinition } from '../../types';
export default {
  id: 'color-sample',
  name: '像素颜色采样',
  category: 'image-audio',
  group: '图像分析',
  keywords: ['color', 'sample', 'pixel', 'pick', '颜色', '采样'],
  modes: ['analyze'],
  hasFileInput: true,
  exampleInput: '拖入图片文件',
  defaultParams: { x: '0', y: '0' },
} satisfies ToolDefinition;
