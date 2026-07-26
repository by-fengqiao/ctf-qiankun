import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

/* ============================================================
 * CORS Configuration Checker
 * Analyzes CORS headers, detects misconfigurations,
 * evaluates risk level, and suggests exploitation/fixes.
 * ========================================================== */

interface HeaderInfo {
  acao: string;
  acac: string;
  acam: string;
  acah: string;
  acma: string;
  vary: string;
}

const parseHeaders = (input: string): HeaderInfo => {
  const lines = input.split('\n');
  const headers: Record<string, string> = {};
  for (const line of lines) {
    const idx = line.indexOf(':');
    if (idx > 0) {
      const key = line.substring(0, idx).trim().toLowerCase();
      const val = line.substring(idx + 1).trim();
      headers[key] = val;
    }
  }
  return {
    acao: headers['access-control-allow-origin'] ?? '',
    acac: headers['access-control-allow-credentials'] ?? '',
    acam: headers['access-control-allow-methods'] ?? '',
    acah: headers['access-control-allow-headers'] ?? '',
    acma: headers['access-control-max-age'] ?? '',
    vary: headers['vary'] ?? '',
  };
};

const checkCors = (input: string): string => {
  const h = parseHeaders(input);
  const lines: string[] = [];
  const risks: string[] = [];
  const exploits: string[] = [];
  const fixes: string[] = [];

  lines.push('── CORS 配置检测 ──');
  lines.push('');
  lines.push(' ▸ 检测到的 CORS 头:');
  lines.push(`   ACAO (Allow-Origin):      ${h.acao || '(未设置)'}`);
  lines.push(`   ACAC (Allow-Credentials): ${h.acac || '(未设置)'}`);
  lines.push(`   ACAM (Allow-Methods):     ${h.acam || '(未设置)'}`);
  lines.push(`   ACAH (Allow-Headers):     ${h.acah || '(未设置)'}`);
  lines.push(`   ACMA (Max-Age):           ${h.acma || '(未设置)'}`);
  lines.push(`   Vary:                     ${h.vary || '(未设置)'}`);
  lines.push('');

  // Check 1: ACAO = * with ACAC = true (CRITICAL)
  if (h.acao === '*' && h.acac.toLowerCase() === 'true') {
    risks.push('CRITICAL: ACAO=* 且 ACAC=true — 浏览器会拒绝此组合, 但表明配置意图错误');
    exploits.push('虽然浏览器会拒绝 *, 但某些非标准实现可能仍返回凭据');
    fixes.push('不要同时设置 ACAO=* 和 ACAC=true');
  }

  // Check 2: ACAO reflects Origin (HIGH)
  if (h.acao === 'null') {
    risks.push('HIGH: ACAO=null — 允许 null origin, 可通过 sandbox iframe / data: URL 利用');
    if (h.acac.toLowerCase() === 'true') {
      risks.push('CRITICAL: ACAO=null + ACAC=true — 可从 null origin 携带凭据');
      exploits.push('利用: <iframe sandbox="allow-scripts" src="data:text/html,<script>fetch(\'https://target/api\',{credentials:\'include\'})</script>">');
    }
    fixes.push('不要将 ACAO 设置为 null');
    fixes.push('明确白名单允许的 origin, 不匹配 null');
  }

  // Check 3: ACAO reflects any origin (HIGH)
  if (h.acao !== '' && h.acao !== '*' && h.acao !== 'null') {
    if (h.acao.startsWith('http') || h.acao.startsWith('https')) {
      risks.push(`MEDIUM: ACAO 固定值为 ${h.acao} — 检查是否为可信 origin`);
      if (h.acac.toLowerCase() === 'true') {
        risks.push(`HIGH: ACAO=${h.acao} + ACAC=true — 该 origin 可携带凭据跨域访问`);
        exploits.push(`从 ${h.acao} 发起请求: fetch('https://target/api', {credentials:'include'})`);
      }
    }
  }

  // Check 4: Wildcard subdomain
  if (h.acao.includes('*.')) {
    risks.push(`HIGH: ACAO 包含通配符子域名 ${h.acao} — 任意子域名可跨域访问`);
    if (h.acac.toLowerCase() === 'true') {
      risks.push('CRITICAL: 通配符子域名 + ACAC=true — 攻击者注册子域名可窃取凭据');
      exploits.push('1. 在允许的域名下找到/注册子域名');
      exploits.push('2. 从子域名发起跨域请求携带 Cookie');
      exploits.push(`   fetch('https://target/api', {credentials:'include'})`);
    }
    fixes.push('使用精确 origin 白名单, 不用通配符');
  }

  // Check 5: Regex bypass
  if (h.acao.includes('target.com') && h.acao !== 'https://target.com') {
    risks.push('MEDIUM: ACAO 可能使用正则匹配 — 检查是否可绕过');
    exploits.push('尝试以下 origin 绕过:');
    exploits.push('  https://evil.target.com  (子域名)');
    exploits.push('  https://target.com.evil.com  (后缀)');
    exploits.push('  https://evil-target.com  (连字符)');
    exploits.push('  https://target.com%60.evil.com  (反引号编码)');
    exploits.push('  https://target.com%23.evil.com  (#编码)');
    fixes.push('使用精确匹配白名单, 不用正则');
  }

  // Check 6: Missing Vary: Origin
  if (h.acao !== '*' && h.acao !== '' && !h.vary.toLowerCase().includes('origin')) {
    risks.push('LOW: 缺少 Vary: Origin — 可能导致缓存中毒');
    exploits.push('缓存中毒: 一个 origin 的响应被缓存, 另一个 origin 获取错误的 CORS 头');
    fixes.push('添加 Vary: Origin 响应头');
  }

  // Check 7: Preflight cache
  if (h.acma) {
    const maxAge = parseInt(h.acma, 10);
    if (maxAge > 86400) {
      risks.push(`LOW: ACMA=${h.acma} (>${86400}s) — preflight 缓存时间过长`);
      fixes.push('将 ACMA 设置为合理值 (如 600s)');
    }
  }

  // Check 8: ACAM allows dangerous methods
  if (h.acam) {
    const methods = h.acam.toUpperCase();
    if (methods.includes('DELETE') || methods.includes('PUT') || methods.includes('PATCH')) {
      risks.push(`MEDIUM: ACAM 允许危险方法: ${h.acam}`);
      fixes.push('仅允许必要的 HTTP 方法');
    }
  }

  // Determine risk level
  let riskLevel = '安全';
  if (risks.some((r) => r.startsWith('CRITICAL'))) {
    riskLevel = '严重 (CRITICAL)';
  } else if (risks.some((r) => r.startsWith('HIGH'))) {
    riskLevel = '高危 (HIGH)';
  } else if (risks.some((r) => r.startsWith('MEDIUM'))) {
    riskLevel = '中危 (MEDIUM)';
  } else if (risks.some((r) => r.startsWith('LOW'))) {
    riskLevel = '低危 (LOW)';
  }

  lines.push(` ▸ 风险等级: ${riskLevel}`);
  lines.push('');

  if (risks.length > 0) {
    lines.push(' ▸ 风险详情:');
    for (const r of risks) {
      lines.push(`   [${r.split(':')[0]}] ${r.substring(r.indexOf(':') + 1).trim()}`);
    }
    lines.push('');
  } else {
    lines.push(' ▸ 未检测到风险配置');
    lines.push('');
  }

  if (exploits.length > 0) {
    lines.push(' ▸ 利用方法:');
    for (const e of exploits) {
      lines.push(`   ${e}`);
    }
    lines.push('');
  }

  if (fixes.length > 0) {
    lines.push(' ▸ 修复建议:');
    for (const f of fixes) {
      lines.push(`   - ${f}`);
    }
    lines.push('');
  }

  // Always show general best practices
  lines.push(' ▸ CORS 最佳实践:');
  lines.push('   - 使用精确 origin 白名单, 不用通配符');
  lines.push('   - ACAC=true 时, ACAO 必须是精确 origin (非 *)');
  lines.push('   - 添加 Vary: Origin 防止缓存问题');
  lines.push('   - 不信任 Origin 头, 仍需验证用户身份');
  lines.push('   - preflight 仅返回必要的头和方法');
  lines.push('   - 敏感操作不在 CORS 中暴露');
  return lines.join('\n');
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    toolName="CORS配置检测"
    execute={(input: string, _mode: string, _params: Record<string, unknown>): string => {
      return checkCors(input);
    }}
  />
);
export default ToolComponent;
