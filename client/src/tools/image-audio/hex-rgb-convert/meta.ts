import type { ToolDefinition } from '../../types';
export default {
  id: 'hex-rgb-convert',
  name: 'HEX↔RGB 转换',
  category: 'image-audio',
  group: 'Hex/Binary',
  keywords: ['hex', 'rgb', 'convert', 'color', '转换'],
  modes: ['encode', 'decode'],
  exampleInput: '#408bd1 或 rgb(64,139,209)',
} satisfies ToolDefinition;
