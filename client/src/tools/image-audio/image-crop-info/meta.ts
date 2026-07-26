import type { ToolDefinition } from '../../types';
export default {
  id: 'image-crop-info',
  name: '图片裁剪计算',
  category: 'image-audio',
  group: '图像处理',
  keywords: ['crop', 'cut', 'region', '裁剪', '计算'],
  modes: ['analyze'],
  exampleInput: '800,600,100,50,400,300',
  defaultParams: { width: '800', height: '600', x: '0', y: '0', cropW: '100', cropH: '100' },
} satisfies ToolDefinition;
