import type { ToolDefinition } from '../../types';
export default {
  id: 'sstv-identify',
  name: 'SSTV 模式识别',
  category: 'image-audio',
  group: '频谱/信号',
  keywords: ['sstv', 'slow', 'scan', 'television', 'identify', '慢扫描电视'],
  modes: ['analyze'],
  hasFileInput: true,
  exampleInput: '拖入 WAV 音频文件',
} satisfies ToolDefinition;
