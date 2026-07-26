import type { ToolDefinition } from '../../types';
export default {
  id: 'image-crop',
  name: '图片裁剪',
  category: 'image-audio',
  group: '图像处理',
  keywords: ['crop', 'cut', '裁剪', '裁切'],
  modes: ['analyze'],
  hasFileInput: true,
  exampleInput: '拖入图片文件',
  defaultParams: { x: '0', y: '0', width: '100', height: '100' },
} satisfies ToolDefinition;
