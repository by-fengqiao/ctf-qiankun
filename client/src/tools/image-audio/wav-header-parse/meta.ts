import type { ToolDefinition } from '../../types';
export default {
  id: 'wav-header-parse',
  name: 'WAV 头部解析',
  category: 'image-audio',
  group: '音频',
  keywords: ['wav', 'header', 'parse', 'audio', 'WAV', '解析'],
  modes: ['analyze'],
  hasFileInput: true,
  exampleInput: '拖入 WAV 音频文件',
} satisfies ToolDefinition;
