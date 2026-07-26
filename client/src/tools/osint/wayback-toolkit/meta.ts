import type { ToolDefinition } from '../../types';
export default {
  id: 'wayback-toolkit',
  name: 'Wayback Machine 工具',
  description: '生成 Wayback Machine 查询 URL（CDX/日历/快照）及敏感路径组合',
  category: 'osint',
  group: '归档',
  keywords: ['wayback', 'archive', 'web archive', 'cdx', '快照', '历史网页', '存档', 'sensitive'],
  modes: ['generate'],
  hasFileInput: false,
  exampleInput: 'example.com',
} satisfies ToolDefinition;
