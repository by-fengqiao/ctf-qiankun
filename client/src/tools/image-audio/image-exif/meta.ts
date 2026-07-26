import type { ToolDefinition } from '../../types';
export default {
  id: 'image-exif',
  name: 'EXIF 信息提取',
  category: 'image-audio',
  group: '图像分析',
  keywords: ['exif', 'jpeg', 'metadata', 'camera', 'gps', 'EXIF', '元数据'],
  modes: ['analyze'],
  exampleInput: 'FFD8FFE1',
} satisfies ToolDefinition;
