import type { ToolDefinition } from '../../types';
export default {
  id: 'audio-metadata',
  name: '音频元数据查看',
  category: 'image-audio',
  group: '音频',
  keywords: ['audio', 'metadata', 'tag', 'id3', '元数据'],
  modes: ['analyze'],
  hasFileInput: true,
  exampleInput: '拖入音频文件',
} satisfies ToolDefinition;
