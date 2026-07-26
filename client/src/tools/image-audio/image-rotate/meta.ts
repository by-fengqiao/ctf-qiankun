import type { ToolDefinition } from '../../types';
export default {
  id: 'image-rotate',
  name: '图片旋转',
  category: 'image-audio',
  group: '图像处理',
  keywords: ['rotate', 'turn', '旋转', '翻转角度'],
  modes: ['analyze'],
  hasFileInput: true,
  exampleInput: '拖入图片文件',
  defaultParams: { degrees: '90' },
} satisfies ToolDefinition;
