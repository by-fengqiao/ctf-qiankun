import type { ToolDefinition } from '../../types';

export default {
  id: 'xxe-payload',
  name: 'XXE Payload生成器',
  description: '按场景与解析器生成 XXE Payload（文件读取/SSRF/Blind OOB/DoS/RCE）',
  category: 'web-security',
  group: '注入',
  keywords: ['xxe', 'xml external entity', 'xml注入', 'ssrf', 'oob', 'billion laughs'],
  modes: ['generate'],
  exampleInput: '',
  defaultParams: { scenario: 'file-read', parser: 'libxml2' },
} satisfies ToolDefinition;
