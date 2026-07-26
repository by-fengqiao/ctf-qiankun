import type { ToolDefinition } from '../../types';
export default {
  id: 'image-to-ascii',
  name: '图片转 ASCII',
  description: '将上传的图片（或十六进制图片数据）转换为 ASCII 字符画',
  category: 'image-audio',
  group: '图像处理',
  keywords: ['ascii', 'art', 'convert', 'ASCII', '字符画'],
  modes: ['analyze'],
  hasFileInput: true,
  exampleInput: '拖入图片文件',
  defaultParams: { width: '80' },
} satisfies ToolDefinition;
