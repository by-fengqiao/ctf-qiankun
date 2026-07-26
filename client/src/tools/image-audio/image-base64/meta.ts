import type { ToolDefinition } from '../../types';
export default {
  id: 'image-base64',
  name: '图片转 Base64',
  category: 'image-audio',
  group: '图像处理',
  keywords: ['base64', 'datauri', 'data-uri', 'Base64', '编码'],
  modes: ['analyze'],
  hasFileInput: true,
  exampleInput: '拖入图片文件',
} satisfies ToolDefinition;
