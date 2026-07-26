import type { ToolDefinition } from '../../types';
export default {
  id: 'image-format-convert',
  name: '图片格式转换',
  category: 'image-audio',
  group: '图像处理',
  keywords: ['format', 'convert', 'png', 'jpeg', '格式', '转换'],
  modes: ['analyze'],
  hasFileInput: true,
  exampleInput: '拖入图片文件',
  defaultParams: { format: 'png' },
} satisfies ToolDefinition;
