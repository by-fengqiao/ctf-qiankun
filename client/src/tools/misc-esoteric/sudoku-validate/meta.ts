import type { ToolDefinition } from '../../types';

export default {
  id: 'sudoku-validate',
  name: '数独验证',
  category: 'misc-esoteric',
  group: '其他',
  keywords: ['sudoku', 'validate', '数独', '验证', 'puzzle', '九宫格'],
  modes: ['analyze'],
  exampleInput: '534678912672195348198342567859761423426853791713924856961537284287419635345286179',
} satisfies ToolDefinition;
