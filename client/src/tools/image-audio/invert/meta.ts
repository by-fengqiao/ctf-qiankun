import type { ToolDefinition } from '../../types';
export default {
  id: 'invert',
  name: '颜色反转',
  category: 'image-audio',
  group: '图像处理',
  keywords: ['invert', 'negative', '反转', '反色'],
  modes: ['analyze'],
  hasFileInput: true,
  exampleInput: '拖入图片文件',
} satisfies ToolDefinition;
