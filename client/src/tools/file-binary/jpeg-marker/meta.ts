import type { ToolDefinition } from '../../types';
export default {
  id: 'jpeg-marker',
  name: 'JPEG Marker分析',
  category: 'file-binary',
  group: '文件格式',
  keywords: ['jpeg', 'jpg', 'marker', 'SOI', 'SOF', 'DQT', 'DHT', 'SOS', 'EOI', 'JPEG'],
  modes: ['analyze'],
  exampleInput: 'ffd8ffe000104a46494600010100000100010000ffdb0043000302',
} satisfies ToolDefinition;
