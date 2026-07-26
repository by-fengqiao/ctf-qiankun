import type { ToolDefinition } from '../../types';
export default {
  id: 'bitplane-extract',
  name: '位平面提取',
  description: '从图像中提取指定位平面（LSB 到 MSB），可视化隐写数据',
  category: 'stego',
  group: '图像',
  keywords: ['bitplane', 'lsb', 'msb', 'bit', 'plane', 'extract', '位平面', '提取'],
  modes: ['extract'],
  hasFileInput: true,
  exampleInput: '拖入 PNG/BMP 图片',
  defaultParams: { plane: '0' },
} satisfies ToolDefinition;
