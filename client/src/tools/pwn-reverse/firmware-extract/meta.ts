import type { ToolDefinition } from '../../types';

export default {
  id: 'firmware-extract',
  name: '固件提取',
  category: 'pwn-reverse',
  group: '辅助',
  keywords: ['firmware', 'squashfs', 'jffs2', 'cramfs', 'ubi', '固件', 'binwalk'],
  modes: ['execute'],
  hasFileInput: true,
} satisfies ToolDefinition;
