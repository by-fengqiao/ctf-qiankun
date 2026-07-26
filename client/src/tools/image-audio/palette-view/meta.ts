import type { ToolDefinition } from '../../types';
export default {
  id: 'palette-view',
  name: '颜色调色板提取',
  category: 'image-audio',
  group: '图像分析',
  keywords: ['palette', 'color', 'extract', '调色板', '取色'],
  modes: ['analyze'],
  hasFileInput: true,
  exampleInput: '拖入图片文件',
  defaultParams: { count: '8' },
} satisfies ToolDefinition;
