import type { ToolDefinition } from '../../types';

export default {
  id: 'pigpen-misc',
  name: '猪圈密码',
  category: 'misc-esoteric',
  group: '密码/编码',
  keywords: ['pigpen', 'masonic', 'freemason', '猪圈', '共济会', '密码', 'cipher', 'encode', 'decode'],
  modes: ['encode', 'decode'],
  exampleInput: 'Hello',
  modeOptions: [
    { value: 'encode', label: '编码' },
    { value: 'decode', label: '解码' },
  ],
} satisfies ToolDefinition;
