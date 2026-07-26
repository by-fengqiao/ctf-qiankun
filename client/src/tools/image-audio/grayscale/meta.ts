import type { ToolDefinition } from '../../types';
export default {
  id: 'grayscale',
  name: '灰度化',
  category: 'image-audio',
  group: '图像处理',
  keywords: ['grayscale', 'grey', 'gray', '灰度'],
  modes: ['analyze'],
  hasFileInput: true,
  exampleInput: '拖入图片文件',
} satisfies ToolDefinition;
