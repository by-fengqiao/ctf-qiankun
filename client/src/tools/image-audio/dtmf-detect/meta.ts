import type { ToolDefinition } from '../../types';
export default {
  id: 'dtmf-detect',
  name: 'DTMF 双音多频检测',
  category: 'image-audio',
  group: '频谱/信号',
  keywords: ['dtmf', 'tone', 'detect', '双音多频', '拨号', '检测'],
  modes: ['analyze'],
  exampleInput: '1209,697 1336,770 1477,852',
} satisfies ToolDefinition;
