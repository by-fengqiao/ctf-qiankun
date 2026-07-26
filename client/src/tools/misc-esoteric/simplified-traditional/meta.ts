import type { ToolDefinition } from '../../types';

export default {
  id: 'simplified-traditional',
  name: '简繁转换',
  category: 'misc-esoteric',
  group: '密码/编码',
  keywords: ['simplified', 'traditional', '简体', '繁体', '简繁', '转换', 'encode', 'decode'],
  modes: ['encode', 'decode'],
  exampleInput: '简体中文测试',
  modeOptions: [
    { value: 'encode', label: '简→繁' },
    { value: 'decode', label: '繁→简' },
  ],
} satisfies ToolDefinition;
