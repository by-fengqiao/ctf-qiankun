import type { ToolDefinition } from '../../types';
export default {
  id: 'audio-sample-info',
  name: '音频采样信息',
  category: 'image-audio',
  group: '音频',
  keywords: ['audio', 'sample', 'info', '采样率', '声道', '时长'],
  modes: ['analyze'],
  hasFileInput: true,
  exampleInput: '拖入音频文件',
} satisfies ToolDefinition;
