import type { ToolDefinition } from '../../types';
export default {
  id: 'audio-morse',
  name: '音频摩斯电码解码',
  description: '从 WAV 音频中检测音调通断，解码摩斯电码',
  category: 'stego',
  group: '音频',
  keywords: ['audio', 'morse', 'decode', 'code', '摩斯', '电码', '音频'],
  modes: ['decode'],
  hasFileInput: true,
  exampleInput: '拖入含摩斯电码的 WAV 文件',
} satisfies ToolDefinition;
