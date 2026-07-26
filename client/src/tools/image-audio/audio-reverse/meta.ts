import type { ToolDefinition } from '../../types';
export default {
  id: 'audio-reverse',
  name: '音频反转',
  category: 'image-audio',
  group: '音频',
  keywords: ['audio', 'reverse', 'backwards', '音频', '反转', '倒放'],
  modes: ['analyze'],
  hasFileInput: true,
  exampleInput: '拖入 WAV 音频文件',
} satisfies ToolDefinition;
