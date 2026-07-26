import type { ToolDefinition } from '../../types';

export default {
  id: 'nonogram-info',
  name: '非ogram解析',
  category: 'misc-esoteric',
  group: '其他',
  keywords: ['nonogram', 'picross', 'griddler', '数织', '拼图', '线索', 'puzzle'],
  modes: ['analyze'],
  exampleInput: 'rows:\n3 1\n1 3\n2 2\ncols:\n2 1\n1 2\n3 1',
} satisfies ToolDefinition;
