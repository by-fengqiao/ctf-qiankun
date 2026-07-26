import type { ToolDefinition } from '../../types';

export default {
  id: 'befunge',
  name: 'Befunge-93',
  category: 'misc-esoteric',
  group: 'Esolang',
  keywords: ['befunge', 'befunge93', 'esoteric', '深奥语言', '2d-grid', 'stack'],
  modes: ['execute'],
  exampleInput: '64+"!dlroW ,olleH">:#,_@',
} satisfies ToolDefinition;
