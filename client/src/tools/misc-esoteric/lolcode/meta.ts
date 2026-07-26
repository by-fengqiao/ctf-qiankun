import type { ToolDefinition } from '../../types';

export default {
  id: 'lolcode',
  name: 'LOLCODE',
  category: 'misc-esoteric',
  group: 'Esolang',
  keywords: ['lolcode', 'lol', 'esoteric', '深奥语言', 'meme'],
  modes: ['execute'],
  exampleInput: 'HAI 1.2\nVISIBLE "HAI WORLD!"\nKTHXBYE',
} satisfies ToolDefinition;
