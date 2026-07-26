import type { ToolDefinition } from '../../types';
export default {
  id: 'image-size',
  name: '图片尺寸获取',
  category: 'file-binary',
  group: '文件分析',
  keywords: ['image', 'size', 'dimension', 'width', 'height', '图片', '尺寸'],
  modes: ['analyze'],
  exampleInput: '89504e470d0a1a0a0000000d4948445200000100000001000802000000',
} satisfies ToolDefinition;
