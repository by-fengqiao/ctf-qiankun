import type { ToolDefinition } from '../../types';

export default {
  id: 'sqlite-recovery',
  name: 'SQLite数据库恢复',
  description: '解析 SQLite .db 文件头部与 B-tree 页，提取 schema、活动记录与已删除记录恢复',
  category: 'forensics',
  group: '磁盘/文件',
  keywords: ['sqlite', 'database', 'db', 'btree', 'recovery', 'deleted', 'forensics', '取证', '数据库恢复'],
  modes: ['analyze'],
  hasFileInput: true,
  exampleInput: '53514C69746520666F726D61742033...',
} satisfies ToolDefinition;
