import type { ToolDefinition } from '../../types';

export default {
  id: 'stack-visualizer',
  name: '栈布局可视化',
  description: '根据参数生成 ASCII 栈布局图，展示参数、返回地址、局部变量与缓冲区',
  category: 'pwn-reverse',
  group: '辅助',
  keywords: ['stack', '栈', '栈布局', 'stack layout', '局部变量', '返回地址', '缓冲区', '可视化'],
  modes: ['generate'],
  paramsConfig: [
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
      name: 'buffer-size',
      label: '缓冲区大小',
      type: 'text',
      default: '64',
      placeholder: '字节数',
    },
    {
      name: 'local-vars',
      label: '局部变量',
      type: 'text',
      default: '[{"name":"canary","size":8},{"name":"i","size":4}]',
      placeholder: 'JSON数组',
    },
  ],
  exampleInput: 'main函数栈帧',
} satisfies ToolDefinition;
