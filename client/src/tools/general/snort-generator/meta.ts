import type { ToolDefinition } from '../../types';

export default {
  id: 'snort-generator',
  name: 'Snort 规则生成器',
  description: '根据检测字段生成 Snort IDS 规则',
  category: 'general',
  group: '规则生成',
  keywords: ['snort', 'ids', 'ips', 'rule', '规则', '生成', '检测'],
  modes: ['generate'],
  hasFileInput: false,
  exampleInput: 'msg=Test Rule\ncontent=|90 90 90 90|\nsid=1000001',
  defaultParams: { action: 'alert', proto: 'tcp' },
} satisfies ToolDefinition;
