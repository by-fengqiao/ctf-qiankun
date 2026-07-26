import type { ToolDefinition } from '../../types';
export default {
  id: 'spectrogram',
  name: 'WAV 音频信息',
  description: '解析 WAV 文件头，显示采样率、通道数、位深度等基础信息',
  category: 'image-audio',
  group: '频谱/信号',
  keywords: ['spectrogram', 'frequency', 'fft', 'audio', '频谱', '频率'],
  modes: ['analyze'],
  hasFileInput: true,
  exampleInput: '拖入音频文件',
} satisfies ToolDefinition;
