import type { ToolDefinition } from '../../types';

export default {
  id: 'apk-parser',
  name: 'APK/DEX解析',
  category: 'pwn-reverse',
  group: '文件解析',
  keywords: ['apk', 'dex', 'android', 'dalvik', 'manifest', '安卓'],
  modes: ['execute'],
  hasFileInput: true,
  defaultParams: { mode: 'apk' },
} satisfies ToolDefinition;
