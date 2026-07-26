import type { ToolDefinition } from '../../types';

export default {
  id: 'z85',
  name: 'Z85 (ZeroMQ Base85)',
  category: 'encoding',
  group: 'Base族',
  keywords: ['z85', 'zeromq', 'zmq', 'base85'],
  modes: ['encode', 'decode'],
  exampleInput: 'Hello World',
} satisfies ToolDefinition;
