import type { ToolDefinition } from '../../types';

export default {
  id: 'deserialization',
  name: '反序列化Payload构造',
  description: '按语言与利用类型生成反序列化 Payload（PHP/Java/Python/Ruby）',
  category: 'web-security',
  group: '其他',
  keywords: ['deserialization', '反序列化', 'unserialize', 'pickle', 'ysoserial', 'gadget'],
  modes: ['generate'],
  exampleInput: '',
  defaultParams: { lang: 'php', gadget: 'cmd-exec' },
} satisfies ToolDefinition;
