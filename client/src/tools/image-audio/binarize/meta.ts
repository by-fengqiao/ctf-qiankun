import type { ToolDefinition } from '../../types';
export default {
  id: 'binarize',
  name: '二值化',
  category: 'image-audio',
  group: '图像处理',
  keywords: ['binarize', 'threshold', 'binary', '二值化', '阈值'],
  modes: ['analyze'],
  hasFileInput: true,
  exampleInput: '拖入图片文件',
  defaultParams: { threshold: '128' },
} satisfies ToolDefinition;
