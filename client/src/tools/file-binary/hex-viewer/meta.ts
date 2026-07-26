import type { ToolDefinition } from '../../types';
export default {
  id: 'hex-viewer',
  name: 'Hex查看器',
  category: 'file-binary',
  group: 'Hex/Binary',
  keywords: ['hex', 'viewer', '十六进制', '查看', 'dump'],
  modes: ['analyze'],
  hasFileInput: true,
  exampleInput: 'Hello World',
  defaultParams: { bytesPerLine: '16' },
} satisfies ToolDefinition;
