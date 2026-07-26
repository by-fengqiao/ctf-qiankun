import type { ToolDefinition } from '../../types';

export default {
  id: 'format-string',
  name: '格式化字符串漏洞辅助',
  description: '生成 %n 写入与 %p 泄露 payload，自动计算填充与偏移',
  category: 'pwn-reverse',
  group: '利用构造',
  keywords: ['format string', '格式化字符串', 'printf', 'percent n', 'percent p', '%n', '%p', '漏洞'],
  modes: ['execute'],
  modeOptions: [
    { value: 'write-percent-n', label: '%n写入' },
    { value: 'leak-percent-p', label: '%p泄露' },
  ],
  paramsConfig: [
    {
      name: 'target_addr',
      label: '目标地址',
      type: 'text',
      default: '0x804a024',
      placeholder: 'hex地址',
    },
    {
      name: 'arch',
      label: '架构',
      type: 'select',
      default: '64',
      options: [
        { value: '32', label: '32位' },
        { value: '64', label: '64位' },
      ],
    },
    {
      name: 'offset',
      label: '偏移量',
      type: 'text',
      default: '6',
      placeholder: '数字',
    },
  ],
  exampleInput: 'AAAA',
} satisfies ToolDefinition;
