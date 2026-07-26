import type { ToolDefinition } from '../../types';
export default {
  id: 'image-flip',
  name: '图片翻转',
  category: 'image-audio',
  group: '图像处理',
  keywords: ['flip', 'mirror', '翻转', '镜像'],
  modes: ['analyze'],
  hasFileInput: true,
  exampleInput: '拖入图片文件',
  defaultParams: { direction: 'horizontal' },
} satisfies ToolDefinition;
