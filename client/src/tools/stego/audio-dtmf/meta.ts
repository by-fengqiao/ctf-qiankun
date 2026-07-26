import type { ToolDefinition } from '../../types';
export default {
  id: 'audio-dtmf',
  name: 'DTMF双音多频解码',
  description: '使用 Goertzel 算法从 WAV 音频中检测 DTMF 拨号序列',
  category: 'stego',
  group: '音频',
  keywords: ['audio', 'dtmf', 'tone', 'decode', '双音多频', '拨号', '音频'],
  modes: ['decode'],
  hasFileInput: true,
  exampleInput: '拖入含 DTMF 信号的 WAV 文件',
} satisfies ToolDefinition;
