import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

interface RecordType {
  type: string;
  desc: string;
}

const RECORD_TYPES: RecordType[] = [
  { type: 'A', desc: 'IPv4 地址' },
  { type: 'AAAA', desc: 'IPv6 地址' },
  { type: 'MX', desc: '邮件交换' },
  { type: 'NS', desc: '域名服务器' },
  { type: 'TXT', desc: '文本记录 (含 SPF)' },
  { type: 'SOA', desc: '授权起始' },
  { type: 'CNAME', desc: '规范名/别名' },
  { type: 'CAA', desc: '证书颁发机构授权' },
  { type: 'PTR', desc: '反向解析' },
  { type: 'SRV', desc: '服务记录' },
  { type: 'DNSKEY', desc: 'DNS 公钥' },
  { type: 'DS', desc: '委托签名' },
];

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    toolName="DNS 记录查询生成器"
    paramsConfig={[
      { name: 'dkim_selector', label: 'DKIM 选择器', type: 'text', placeholder: 'default', default: 'default' },
    ]}
    execute={(input: string, _mode: string, params: Record<string, unknown>): string => {
      const domain = input.trim();
      if (!domain) return '请输入域名（如 example.com）';
      const selector = (params.dkim_selector as string) || 'default';
      const out: string[] = ['DNS 记录查询', '═'.repeat(60), ''];
      out.push(`域名: ${domain}`);
      out.push('');

      out.push('── dig 命令 ──');
      out.push(`dig ${domain} ANY +noall +answer`);
      for (const r of RECORD_TYPES) {
        out.push(`dig ${domain} ${r.type} +short`);
      }
      out.push(`dig ${domain} TXT +short  # SPF`);
      out.push(`dig ${selector}._domainkey.${domain} TXT +short  # DKIM`);
      out.push(`dig _dmarc.${domain} TXT +short  # DMARC`);
      out.push('');

      out.push('── nslookup 命令 ──');
      out.push(`nslookup ${domain}`);
      for (const r of RECORD_TYPES) {
        out.push(`nslookup -type=${r.type} ${domain}`);
      }
      out.push(`nslookup -type=TXT _dmarc.${domain}`);
      out.push(`nslookup -type=TXT ${selector}._domainkey.${domain}`);
      out.push('');

      out.push('── host 命令 ──');
      out.push(`host -a ${domain}`);
      out.push(`host -t MX ${domain}`);
      out.push(`host -t TXT ${domain}`);
      out.push('');

      out.push('── 指定 DNS 服务器 ──');
      out.push(`dig @8.8.8.8 ${domain} A  # Google DNS`);
      out.push(`dig @1.1.1.1 ${domain} A  # Cloudflare`);
      out.push(`dig @114.114.114.114 ${domain} A  # 114DNS`);
      out.push(`dig @223.5.5.5 ${domain} A  # 阿里 DNS`);
      out.push('');

      out.push('── 在线查询链接 ──');
      out.push('Google Dig:');
      out.push(`  → https://dns.google/resolve?name=${domain}&type=A`);
      out.push('Cloudflare:');
      out.push(`  → https://cloudflare-dns.com/dns-query?name=${domain}&type=A`);
      out.push('MxToolbox:');
      out.push(`  → https://mxtoolbox.com/SuperTool.aspx?action=dns%3a${domain}&run=toolpage`);
      out.push(`  → https://mxtoolbox.com/SuperTool.aspx?action=mx%3a${domain}`);
      out.push('DNS Checker:');
      out.push(`  → https://dnschecker.org/#A/${domain}`);
      out.push('IntoDNS:');
      out.push(`  → https://intodns.com/${domain}`);
      out.push('ViewDNS:');
      out.push(`  → https://viewdns.info/dnsrecord/?domain=${domain}`);
      out.push(`  → https://viewdns.info/propagation/?domain=${domain}`);
      out.push('SecurityTrails:');
      out.push(`  → https://securitytrails.com/domain/${domain}/dns`);
      out.push('');

      out.push('── 安全记录 (SPF/DKIM/DMARC) ──');
      out.push(`SPF:`);
      out.push(`  dig ${domain} TXT +short | grep spf`);
      out.push(`  → https://mxtoolbox.com/spf.aspx?domain=${domain}`);
      out.push(`DMARC:`);
      out.push(`  dig _dmarc.${domain} TXT +short`);
      out.push(`  → https://mxtoolbox.com/DMARC.aspx?domain=${domain}`);
      out.push(`DKIM (selector=${selector}):`);
      out.push(`  dig ${selector}._domainkey.${domain} TXT +short`);
      out.push(`  → https://mxtoolbox.com/DKIM.aspx?domain=${domain}&selector=${selector}`);
      out.push('常见 DKIM selector: default google s1 s1024 mail selector k1');
      out.push('');

      out.push('── 反向查询 ──');
      out.push('  dig -x <IP> +short');
      out.push('  nslookup <IP>');
      out.push('');

      out.push('── 区域传输测试 ──');
      out.push(`  dig axfr ${domain}`);
      out.push(`  dig axfr ${domain} @ns1.${domain}`);
      out.push('  说明: 若返回区域数据则存在 DNS 配置漏洞');
      return out.join('\n');
    }}
  />
);
export default ToolComponent;
