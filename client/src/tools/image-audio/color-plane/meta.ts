import type { ToolDefinition } from '../../types';
export default {
  id: 'color-plane',
  name: '颜色平面提取',
  category: 'image-audio',
  group: '隐写',
  keywords: ['color', 'plane', 'channel', 'extract', '颜色', '平面'],
  modes: ['analyze'],
  hasFileInput: true,
  exampleInput: '拖入图片文件',
  defaultParams: { channel: 'R' },
} satisfies ToolDefinition;
