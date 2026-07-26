import type { ToolDefinition } from '../../types';

export default {
  id: 'whitespace',
  name: 'Whitespace',
  category: 'misc-esoteric',
  group: 'Esolang',
  keywords: ['whitespace', 'ws', 'esoteric', '深奥语言', '空格制表符'],
  modes: ['execute'],
  exampleInput:
    '   \t  \t\n\t\n \t\n\n\n',
} satisfies ToolDefinition;
