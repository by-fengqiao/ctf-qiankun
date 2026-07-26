import type { ToolDefinition } from '../../types';

export default {
  id: 'brainfuck',
  name: 'Brainfuck',
  category: 'misc-esoteric',
  group: 'Esolang',
  keywords: ['brainfuck', 'bf', 'esoteric', 'bfuck', '深奥语言'],
  modes: ['execute'],
  exampleInput:
    '++++++++++[>+++++++>++++++++++>+++>+<<<<-]>++.>+.+++++++..+++.>++.<<+++++++++++++++.>.+++.',
} satisfies ToolDefinition;
