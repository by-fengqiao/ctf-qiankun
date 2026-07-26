import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

interface IpRange {
  cidr: string;
  label: string;
  category: string;
}

const RANGES: IpRange[] = [
  { cidr: '10.0.0.0/8', label: 'A 类私有', category: '私有' },
  { cidr: '172.16.0.0/12', label: 'B 类私有', category: '私有' },
  { cidr: '192.168.0.0/16', label: 'C 类私有', category: '私有' },
  { cidr: '127.0.0.0/8', label: '环回地址', category: '保留' },
  { cidr: '169.254.0.0/16', label: '链路本地 (APIPA)', category: '保留' },
  { cidr: '100.64.0.0/10', label: '运营商级 NAT (CGNAT)', category: '保留' },
  { cidr: '0.0.0.0/8', label: '本网络', category: '保留' },
  { cidr: '192.0.2.0/24', label: 'TEST-NET-1 (文档)', category: '文档' },
  { cidr: '198.51.100.0/24', label: 'TEST-NET-2 (文档)', category: '文档' },
  { cidr: '203.0.113.0/24', label: 'TEST-NET-3 (文档)', category: '文档' },
  { cidr: '198.18.0.0/15', label: '基准测试', category: '保留' },
  { cidr: '224.0.0.0/4', label: '组播', category: '保留' },
  { cidr: '240.0.0.0/4', label: '保留 (E 类)', category: '保留' },
];

function ipToInt(ip: string): number {
  const parts = ip.split('.').map((p: string) => parseInt(p, 10));
  if (parts.length !== 4 || parts.some((p: number) => Number.isNaN(p) || p < 0 || p > 255)) {
    return -1;
  }
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

function cidrToRange(cidr: string): { start: number; end: number } {
  const [base, bits] = cidr.split('/');
  const mask = bits === '0' ? 0 : (0xffffffff << (32 - parseInt(bits, 10))) >>> 0;
  const start = ipToInt(base);
  const end = (start | (~mask >>> 0)) >>> 0;
  return { start, end };
}

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    toolName="IP 地理定位"
    execute={(input: string): string => {
      const ip = input.trim();
      if (!ip) return '请输入 IPv4 地址';
      const ipInt = ipToInt(ip);
      if (ipInt === -1) return '无效的 IPv4 地址格式';
      const out: string[] = ['IP 地理定位', '═'.repeat(50), ''];
      out.push(`IP: ${ip}`);
      out.push(`整数: ${ipInt}`);
      const octets = ip.split('.');
      out.push(`二进制: ${octets.map((o: string) => parseInt(o, 10).toString(2).padStart(8, '0')).join('.')}`);
      out.push('');

      let matched: IpRange | null = null;
      for (const r of RANGES) {
        const { start, end } = cidrToRange(r.cidr);
        if (ipInt >= start && ipInt <= end) {
          matched = r;
          break;
        }
      }
      out.push('── 地址分类 ──');
      if (matched) {
        out.push(`类型: ${matched.category} 地址`);
        out.push(`范围: ${matched.cidr} (${matched.label})`);
        out.push('说明: 该地址段为内部/保留地址，不可在公网路由，无地理归属。');
        if (matched.category === '私有' || matched.category === '保留') {
          out.push('', '── 常见用途 ──');
          if (matched.cidr === '127.0.0.0/8') out.push('  环回测试 (localhost)');
          if (matched.cidr === '169.254.0.0/16') out.push('  DHCP 失败自动分配 / 云元数据服务 (169.254.169.254)');
          if (matched.cidr === '100.64.0.0/10') out.push('  运营商 NAT 共享公网 IP');
        }
        return out.join('\n');
      }
      out.push('类型: 公网地址 (可路由)');
      out.push('');

      out.push('── 在线查询链接 ──');
      out.push(`ipinfo.io:    https://ipinfo.io/${ip}`);
      out.push(`ip-api.com:   http://ip-api.com/json/${ip}`);
      out.push(`MaxMind:      https://www.maxmind.com/en/geoip-locator/${ip}`);
      out.push(`IPinfo:       https://ipinfo.io/${ip}/json`);
      out.push(`iplocation:   https://www.iplocation.net/ip-lookup?query=${ip}`);
      out.push(`ip138:        https://site.ip138.com/${ip}/`);
      out.push(`站长工具:     https://ip.chinaz.com/${ip}`);
      out.push(`Whois:        https://who.is/whois/ip/${ip}`);
      out.push(`VirusTotal:   https://www.virustotal.com/gui/ip-address/${ip}`);
      out.push(`AbuseIPDB:    https://www.abuseipdb.com/check/${ip}`);
      out.push(`Shodan:       https://www.shodan.io/host/${ip}`);
      out.push(`Censys:       https://search.censys.io/hosts/${ip}`);
      out.push(`GreyNoise:    https://viz.greynoise.io/ip/${ip}`);
      out.push('');

      out.push('── 查询建议 ──');
      out.push(`  curl https://ipinfo.io/${ip}/json`);
      out.push(`  curl http://ip-api.com/json/${ip}`);
      return out.join('\n');
    }}
  />
);
export default ToolComponent;
