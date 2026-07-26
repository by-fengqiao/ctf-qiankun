import type { ToolDefinition } from '../../types';

export default {
  id: 'sigma-generator',
  name: 'Sigma 规则生成器',
  description: '根据检测字段生成 Sigma YAML 规则',
  category: 'general',
  group: '规则生成',
  keywords: ['sigma', 'yaml', 'detection', 'siem', '规则', '生成'],
  modes: ['generate'],
  hasFileInput: false,
  exampleInput: 'Image=cmd.exe\nCommandLine=/c calc.exe',
  defaultParams: { log_source: 'process_creation', name: 'rule_001' },
} satisfies ToolDefinition;
