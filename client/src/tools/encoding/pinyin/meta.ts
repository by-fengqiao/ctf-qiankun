import type { ToolDefinition } from '../../types';

export default {
  id: 'pinyin',
  name: '拼音转换',
  category: 'encoding',
  group: '其他',
  keywords: ['pinyin', '拼音', '中文拼音', '转换'],
  modes: ['generate'],
  exampleInput: '你好世界',
  defaultParams: { type: 'with-tone' },
} satisfies ToolDefinition;
