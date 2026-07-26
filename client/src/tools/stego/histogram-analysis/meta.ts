import type { ToolDefinition } from '../../types';
export default {
  id: 'histogram-analysis',
  name: '直方图分析',
  description: '计算 RGB 通道与亮度直方图，输出分布图与统计信息',
  category: 'stego',
  group: '图像',
  keywords: ['histogram', 'distribution', 'analyze', 'rgb', 'luminance', '直方图', '分布'],
  modes: ['analyze'],
  hasFileInput: true,
  exampleInput: '拖入图片文件',
} satisfies ToolDefinition;
