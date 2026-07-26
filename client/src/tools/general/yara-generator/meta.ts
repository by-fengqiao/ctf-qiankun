import type { ToolDefinition } from '../../types';

export default {
  id: 'yara-generator',
  name: 'YARA 规则生成器',
  description: '根据模式自动生成 YARA 规则，支持字符串/Hex/正则/条件等',
  category: 'general',
  group: '规则生成',
  keywords: ['yara', 'rule', 'malware', 'detection', '规则', '生成', '检测'],
  modes: ['generate'],
  hasFileInput: false,
  exampleInput: 'malware_string',
  defaultParams: { rule_type: 'string', name: 'rule_001' },
} satisfies ToolDefinition;
