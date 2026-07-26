import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

interface AsnInfo {
  asn: string;
  org: string;
  note: string;
}

const CLOUD_ASNS: AsnInfo[] = [
  { asn: 'AS16509', org: 'Amazon AWS', note: 'AWS 全球主干' },
  { asn: 'AS14618', org: 'Amazon AWS', note: 'AWS 北美' },
  { asn: 'AS15169', org: 'Google', note: 'Google LLC' },
  { asn: 'AS396982', org: 'Google', note: 'Google Cloud' },
  { asn: 'AS8075', org: 'Microsoft Azure', note: 'Microsoft' },
  { asn: 'AS13335', org: 'Cloudflare', note: 'Cloudflare CDN' },
  { asn: 'AS37963', org: '阿里云', note: 'Alibaba Cloud' },
  { asn: 'AS45102', org: '阿里云', note: 'Alibaba (US)' },
  { asn: 'AS45090', org: '腾讯云', note: 'Tencent Cloud' },
  { asn: 'AS58466', org: '腾讯云', note: 'Tencent (海外)' },
  { asn: 'AS31898', org: 'Oracle', note: 'Oracle Cloud' },
  { asn: 'AS14061', org: 'DigitalOcean', note: 'DigitalOcean' },
  { asn: 'AS63949', org: 'Linode', note: 'Akamai/Linode' },
  { asn: 'AS24940', org: 'Hetzner', note: 'Hetzner Online' },
  { asn: 'AS16276', org: 'OVH', note: 'OVH SAS' },
  { asn: 'AS62041', org: 'Telegram', note: 'Telegram Messenger' },
  { asn: 'AS32934', org: 'Meta/Facebook', note: 'Facebook' },
  { asn: 'AS2906', org: 'Netflix', note: 'Netflix Streaming' },
  { asn: 'AS8068', org: 'Microsoft', note: 'Microsoft Corp' },
  { asn: 'AS4837', org: '中国联通', note: 'CHINA169 Backbone' },
  { asn: 'AS4134', org: '中国电信', note: 'CHINANET Backbone' },
  { asn: 'AS9808', org: '中国移动', note: 'China Mobile' },
  { asn: 'AS58453', org: '中国电信', note: 'CTG (国际)' },
];

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    toolName="ASN 查询"
    execute={(input: string): string => {
      const raw = input.trim();
      if (!raw) return '请输入 IP 地址或 ASN 编号（如 AS13335 或 13335）';
      const out: string[] = ['ASN 查询', '═'.repeat(50), ''];
      const isAsn = /^AS?\d+$/i.test(raw);
      const asnNum = isAsn ? raw.replace(/^AS/i, '') : '';
      const asn = asnNum ? `AS${asnNum}` : '';

      if (isAsn) {
        out.push(`ASN: ${asn}`);
        out.push(`编号: ${asnNum}`);
        const known = CLOUD_ASNS.find((a: AsnInfo) => a.asn.toUpperCase() === asn.toUpperCase());
        if (known) {
          out.push('', '── 内置信息 ──');
          out.push(`组织: ${known.org}`);
          out.push(`说明: ${known.note}`);
        } else {
          out.push('', '（未在内置常见 ASN 列表中，请用下方链接查询）');
        }
        out.push('', '── 在线查询链接 ──');
        out.push(`bgp.he.net: https://bgp.he.net/${asn}`);
        out.push(`RIPE:       https://apps.db.ripe.net/db-web-ui/query?searchtext=${asn}`);
        out.push(`ARIN:       https://search.arin.net/rdap/?query=${asn}`);
        out.push(`RADB:       https://www.radb.net/query?keywords=${asn}`);
        out.push(`PeeringDB:  https://www.peeringdb.com/asn/${asnNum}`);
        out.push(`bgpview:    https://bgpview.io/asn/${asnNum}`);
        out.push(`bgp.tools:  https://bgp.tools/as/${asnNum}`);
      } else {
        out.push(`输入: ${raw} (按 IP 查询)`);
        out.push('', '── 在线查询链接 ──');
        out.push(`bgp.he.net: https://bgp.he.net/ip/${raw}`);
        out.push(`RIPE:       https://apps.db.ripe.net/db-web-ui/query?searchtext=${raw}`);
        out.push(`ARIN:       https://search.arin.net/rdap/?query=${raw}`);
        out.push(`RADB:       https://www.radb.net/query?keywords=${raw}`);
        out.push(`ipinfo:     https://ipinfo.io/${raw}`);
        out.push(`bgpview:    https://bgpview.io/ip/${raw}`);
        out.push(`bgp.tools:  https://bgp.tools/prefix/${raw}`);
        out.push('', '── 命令行 ──');
        out.push(`  whois -h whois.cymru.com " -v ${raw}"`);
        out.push(`  whois -h whois.radb.net ${raw}`);
      }

      out.push('', '── 常见云厂商 ASN 速查 ──');
      for (const a of CLOUD_ASNS) {
        out.push(`  ${a.asn.padEnd(10)} ${a.org.padEnd(16)} ${a.note}`);
      }
      return out.join('\n');
    }}
  />
);
export default ToolComponent;
