import type { ToolDefinition } from '../../types';

export default {
  id: 'ssti-payload',
  name: '模板注入Payload生成器',
  description: '按模板引擎生成 SSTI 检测、RCE、文件读取 Payload',
  category: 'web-security',
  group: '其他',
  keywords: ['ssti', 'template injection', '模板注入', 'jinja2', 'twig', 'rce'],
  modes: ['generate'],
  exampleInput: '',
  defaultParams: { engine: 'jinja2' },
} satisfies ToolDefinition;
