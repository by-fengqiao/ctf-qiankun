import type { ToolDefinition } from '../../types';

export default {
  id: 'usb-keyboard',
  name: 'USB键盘数据恢复',
  description: '解析 USB HID 键盘数据包（8字节报告），将 HID 键码翻译为按键字符，支持 Shift/Ctrl/Alt 修饰键，重建输入文本',
  category: 'forensics',
  group: '流量',
  keywords: ['usb', '键盘', 'hid', 'keyboard', '键码', 'keycode', '数据恢复', 'forensics', '取证'],
  modes: ['analyze'],
  hasFileInput: true,
  exampleInput: '0000000400000000',
} satisfies ToolDefinition;
