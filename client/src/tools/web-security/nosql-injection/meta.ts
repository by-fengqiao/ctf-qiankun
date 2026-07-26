import type { ToolDefinition } from '../../types';

export default {
  id: 'nosql-injection',
  name: 'NoSQL注入Payload',
  description: '生成 NoSQL 注入 Payload（MongoDB/Redis/CouchDB，$gt/$ne/$regex/$where/聚合管道）',
  category: 'web-security',
  group: '注入',
  keywords: ['nosql', 'mongodb', 'redis', 'couchdb', 'nosql injection', '$gt', '$ne', '$where', 'aggregate'],
  modes: ['generate'],
  exampleInput: '',
  defaultParams: { db: 'mongodb', point: 'json-body' },
} satisfies ToolDefinition;
