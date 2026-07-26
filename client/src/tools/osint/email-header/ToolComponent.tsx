import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

interface ReceivedHop {
  raw: string;
  fromHost: string;
  byHost: string;
  ip: string;
  protocol: string;
  date: string;
  id: string;
}

function extractIp(text: string): string {
  const ipMatch = text.match(/((?:\d{1,3}\.){3}\d{1,3})/);
  return ipMatch ? ipMatch[1] : '';
}

function parseReceived(raw: string): ReceivedHop {
  const fromMatch = raw.match(/from\s+([^\s()]+(?:\s*\([^)]*\))?)/i);
  const byMatch = raw.match(/by\s+([^\s;()]+)/i);
  const protoMatch = raw.match(/with\s+([A-Z0-9]+)/i);
  const dateMatch = raw.match(/;\s*(.+?)$/);
  const idMatch = raw.match(/\bid\s+([^\s;]+)/i);
  const fromHost = fromMatch ? fromMatch[1].replace(/\s*\([^)]*\)/g, '').trim() : '';
  const byHost = byMatch ? byMatch[1].trim() : '';
  return {
    raw,
    fromHost,
    byHost,
    ip: extractIp(raw),
    protocol: protoMatch ? protoMatch[1] : '',
    date: dateMatch ? dateMatch[1].trim() : '',
    id: idMatch ? idMatch[1] : '',
  };
}

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    toolName="邮件头解析"
    execute={(input: string): string => {
      if (!input.trim()) return '请粘贴原始邮件头文本';
      const lines = input.split(/\r?\n/);
      const unfolded: string[] = [];
      for (const raw of lines) {
        if (/^[ \t]/.test(raw) && unfolded.length > 0) {
          unfolded[unfolded.length - 1] += ` ${raw.trim()}`;
        } else {
          unfolded.push(raw);
        }
      }
      const headers: Record<string, string[]> = {};
      for (const line of unfolded) {
        const m = line.match(/^([A-Za-z0-9-]+):\s*(.*)$/);
        if (m) {
          const key = m[1].toLowerCase();
          (headers[key] ??= []).push(m[2].trim());
        }
      }
      const out: string[] = ['邮件头解析报告', '═'.repeat(60), ''];

      const get = (k: string): string => (headers[k]?.[0] ?? '');
      const getAll = (k: string): string[] => (headers[k] ?? []);

      out.push('── 基本信息 ──');
      out.push(`Message-ID:   ${get('message-id') || '(未找到)'}`);
      out.push(`From:         ${get('from')}`);
      out.push(`To:           ${get('to')}`);
      out.push(`Subject:      ${get('subject')}`);
      out.push(`Date:         ${get('date')}`);
      out.push(`Return-Path:  ${get('return-path')}`);
      out.push(`Reply-To:     ${get('reply-to')}`);
      out.push(`MIME-Version: ${get('mime-version')}`);
      out.push(`Content-Type: ${get('content-type')}`);
      out.push('');

      const xOriginIp = get('x-originating-ip');
      out.push('── 来源 IP ──');
      out.push(`X-Originating-IP: ${xOriginIp || '(未找到)'}`);
      const xSenderIp = get('x-sender-ip');
      if (xSenderIp) out.push(`X-Sender-IP:       ${xSenderIp}`);
      out.push('');

      const receivedLines = getAll('received');
      const hops: ReceivedHop[] = receivedLines.map((r: string) => parseReceived(r));
      out.push(`── Received 路由链 (${hops.length} 跳) ──`);
      hops.forEach((hop: ReceivedHop, i: number) => {
        out.push(`[跳 ${i + 1}]`);
        out.push(`  From:    ${hop.fromHost || '(未知)'}`);
        out.push(`  By:      ${hop.byHost || '(未知)'}`);
        out.push(`  IP:      ${hop.ip || '(未提取)'}`);
        out.push(`  协议:    ${hop.protocol || '(未知)'}`);
        if (hop.id) out.push(`  ID:      ${hop.id}`);
        out.push(`  时间:    ${hop.date || '(未知)'}`);
        out.push('');
      });

      if (hops.length > 0) {
        out.push('── 路由时间线 (按跳数) ──');
        hops.forEach((hop: ReceivedHop, i: number) => {
          const ip = hop.ip || '(无IP)';
          const date = hop.date || '(无时间)';
          out.push(`  ${i + 1}. ${ip.padEnd(16)} ${hop.fromHost.padEnd(24)} ${date}`);
        });
        out.push('');
      }

      const allIps = new Set<string>();
      hops.forEach((h: ReceivedHop) => { if (h.ip) allIps.add(h.ip); });
      if (xOriginIp) allIps.add(xOriginIp.replace(/[\[\]]/g, ''));
      if (allIps.size > 0) {
        out.push('── 提取到的所有 IP ──');
        Array.from(allIps).forEach((ip: string) => {
          out.push(`  ${ip}  →  https://www.virustotal.com/gui/ip-address/${ip}`);
        });
        out.push('');
      }

      const authResults = getAll('authentication-results').concat(getAll('auth-results'));
      if (authResults.length > 0) {
        out.push('── 认证结果 (SPF/DKIM/DMARC) ──');
        authResults.forEach((ar: string) => {
          out.push(`Authentication-Results: ${ar}`);
        });
        out.push('');
      } else {
        out.push('── 认证结果 (SPF/DKIM/DMARC) ──');
        out.push('(未找到 Authentication-Results 头)');
        out.push('');
      }

      const spf = authResults.join(' ').match(/spf=(\w+)/i);
      const dkim = authResults.join(' ').match(/dkim=(\w+)/i);
      const dmarc = authResults.join(' ').match(/dmarc=(\w+)/i);
      out.push('── 认证摘要 ──');
      out.push(`SPF:   ${spf ? spf[1] : '(未找到)'}`);
      out.push(`DKIM:  ${dkim ? dkim[1] : '(未找到)'}`);
      out.push(`DMARC: ${dmarc ? dmarc[1] : '(未找到)'}`);
      out.push('');

      const otherKeys = Object.keys(headers).filter(
        (k: string) => !['received', 'message-id', 'from', 'to', 'subject', 'date', 'return-path',
          'reply-to', 'mime-version', 'content-type', 'x-originating-ip', 'x-sender-ip',
          'authentication-results', 'auth-results'].includes(k),
      );
      if (otherKeys.length > 0) {
        out.push('── 其他邮件头 ──');
        for (const k of otherKeys) {
          for (const v of headers[k]) {
            out.push(`${k}: ${v}`);
          }
        }
      }

      return out.join('\n');
    }}
  />
);
export default ToolComponent;
