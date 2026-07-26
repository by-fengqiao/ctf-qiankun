import type { ToolDefinition } from '../../types';
export default {
  id: 'sstv-decoder',
  name: 'SSTV图像解码',
  description: '解析 SSTV 信号，识别 VIS 码、模式与扫描线',
  category: 'stego',
  group: '音频',
  keywords: ['sstv', 'image', 'decode', 'vis', 'martin', 'scottie', '慢扫描电视', '图像'],
  modes: ['decode'],
  hasFileInput: true,
  exampleInput: '拖入 SSTV 信号 WAV 文件',
} satisfies ToolDefinition;
