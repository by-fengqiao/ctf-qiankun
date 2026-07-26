import type { ToolDefinition } from '../../types';
export default {
  id: 'audio-lsb-extract',
  name: '音频 LSB 提取',
  category: 'image-audio',
  group: '隐写',
  keywords: ['audio', 'lsb', 'steganography', 'extract', '音频', '隐写', '提取'],
  modes: ['analyze'],
  hasFileInput: true,
  exampleInput: '拖入 WAV 音频文件',
  defaultParams: { bitCount: '8', channel: '0' },
} satisfies ToolDefinition;
