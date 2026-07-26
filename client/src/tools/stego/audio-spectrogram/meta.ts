import type { ToolDefinition } from '../../types';
export default {
  id: 'audio-spectrogram',
  name: '音频频谱分析',
  description: '解析 WAV 音频，DFT 频谱分析，检测 DTMF/摩斯等隐写信号',
  category: 'stego',
  group: '音频',
  keywords: ['audio', 'spectrum', 'dft', 'frequency', 'dtmf', 'morse', '频谱', '频率', '隐写'],
  modes: ['analyze'],
  hasFileInput: true,
  exampleInput: '拖入 WAV 音频文件',
} satisfies ToolDefinition;
