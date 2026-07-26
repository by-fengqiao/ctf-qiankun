import type { ToolDefinition } from '../../types';

export default {
  id: 'pigpen',
  name: '猪圈密码',
  category: 'classical-crypto',
  group: '编码',
  keywords: ['pigpen', '猪圈', 'masonic', ' Freemason'],
  modes: ['encode', 'decode'],
  exampleInput: 'HELLO',
} satisfies ToolDefinition;
