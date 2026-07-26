import type { ToolDefinition } from '../../types';
export default {
  id: 'dtmf-analyze',
  name: 'DTMF 频率表',
  description: '显示 DTMF 双音多频频率对照表，辅助手动分析',
  category: 'image-audio',
  group: '频谱/信号',
  keywords: ['dtmf', 'tone', 'detect', 'audio', '双音多频', '检测'],
  modes: ['analyze'],
  hasFileInput: true,
  exampleInput: '拖入 WAV 音频文件',
} satisfies ToolDefinition;
