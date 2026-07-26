import type { ToolDefinition } from '../../types';

export default {
  id: 'shellcode-encoder',
  name: 'Shellcode编码器',
  description: 'XOR / 字母数字 / Unicode安全 / 反转+NOT 编码 shellcode，附带解码桩',
  category: 'pwn-reverse',
  group: '利用构造',
  keywords: ['shellcode', '编码', 'xor', 'unicode', '字母数字', '解码桩', 'encoder', 'decoder stub'],
  modes: ['execute'],
  modeOptions: [
    { value: 'xor', label: 'XOR编码' },
    { value: 'alphanumeric', label: '字母数字' },
    { value: 'unicode', label: 'Unicode安全' },
    { value: 'reverse-not', label: '反转+NOT' },
  ],
  paramsConfig: [
    {
      name: 'key',
      label: 'XOR密钥',
      type: 'text',
      default: '90',
      placeholder: 'hex字节, 如 90',
    },
  ],
  exampleInput: '31c048bbd19d9691d08c97ff4831db535f54',
} satisfies ToolDefinition;
