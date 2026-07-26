import type { ToolDefinition } from '../../types';

export default {
  id: 'nato-phonetic',
  name: 'NATO 音标字母',
  category: 'classical-crypto',
  group: '编码',
  keywords: ['nato', 'phonetic', '北约音标', '字母拼读'],
  modes: ['encode', 'decode'],
  exampleInput: 'HELLO',
} satisfies ToolDefinition;
