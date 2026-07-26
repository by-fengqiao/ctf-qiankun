import type { ToolDefinition } from '../../types';
export default {
  id: 'image-metadata-clean',
  name: '图片元数据查看',
  category: 'image-audio',
  group: '图像分析',
  keywords: ['metadata', 'exif', 'clean', '元数据', 'EXIF'],
  modes: ['analyze'],
  hasFileInput: true,
  exampleInput: '拖入图片文件',
} satisfies ToolDefinition;
