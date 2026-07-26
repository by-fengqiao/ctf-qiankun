import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

interface FilterCondition {
  field: string;
  operator: string;
  value: string;
}

const PROTOCOL_FIELDS: Record<string, { display: string[]; bpf: string }> = {
  tcp: {
    display: ['tcp.port', 'tcp.srcport', 'tcp.dstport', 'tcp.flags', 'tcp.seq', 'tcp.ack', 'tcp.window_size', 'tcp.len', 'tcp.payload'],
    bpf: 'tcp',
  },
  udp: {
    display: ['udp.port', 'udp.srcport', 'udp.dstport', 'udp.length', 'udp.payload'],
    bpf: 'udp',
  },
  http: {
    display: ['http.request.method', 'http.host', 'http.request.uri', 'http.response.code', 'http.content_type', 'http.user_agent'],
    bpf: 'tcp port 80',
  },
  dns: {
    display: ['dns.qry.name', 'dns.qry.type', 'dns.flags', 'dns.a', 'dns.cname', 'dns.id'],
    bpf: 'udp port 53',
  },
  tls: {
    display: ['tls.handshake.type', 'tls.record.content_type', 'tls.handshake.extensions_server_name', 'tls.handshake.version'],
    bpf: 'tcp port 443',
  },
  icmp: {
    display: ['icmp.type', 'icmp.code', 'icmp.id', 'icmp.seq', 'icmp.data'],
    bpf: 'icmp',
  },
  arp: {
    display: ['arp.opcode', 'arp.src.hw_mac', 'arp.src.proto_ipv4', 'arp.dst.hw_mac', 'arp.dst.proto_ipv4'],
    bpf: 'arp',
  },
};

function parseConditions(input: string): FilterCondition[] {
  const conditions: FilterCondition[] = [];
  const lines = input.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0);

  for (const line of lines) {
    const match = line.match(/^([\w.]+)\s*(==|!=|>|<|>=|<=|contains|matches)\s*(.+)$/);
    if (match) {
      conditions.push({
        field: match[1],
        operator: match[2],
        value: match[3].trim().replace(/^["']|["']$/g, ''),
      });
    }
  }
  return conditions;
}

function generateDisplayFilter(
  protocol: string,
  conditions: FilterCondition[],
): string {
  const parts: string[] = [];
  const protoFields = PROTOCOL_FIELDS[protocol];

  for (const cond of conditions) {
    let value = cond.value;
    if (!/^\d+$/.test(value) && !/^0x[0-9a-f]+$/i.test(value) && !/^\|.*\|$/i.test(value)) {
      value = `"${value}"`;
    }
    parts.push(`${cond.field} ${cond.operator} ${value}`);
  }

  let filter = parts.join(' and ');
  if (protoFields && parts.length === 0) {
    filter = `${protocol}`;
  }

  let output = '=== Wireshark 显示过滤器 ===\n\n';
  output += `过滤器表达式:\n${filter || '(无条件)'}\n\n`;
  output += `--- 常用 ${protocol.toUpperCase()} 过滤器 ---\n`;
  if (protoFields) {
    for (const field of protoFields.display) {
      output += `  ${field}\n`;
    }
  }
  output += '\n--- 使用说明 ---\n';
  output += '在 Wireshark 显示过滤器栏中粘贴上述表达式\n';
  output += '多条件使用 and/or 连接，not 取反\n';
  output += '字符串值用双引号，Hex 用 |XX XX| 格式\n';

  return output;
}

function generateCaptureFilter(
  protocol: string,
  conditions: FilterCondition[],
): string {
  const protoFields = PROTOCOL_FIELDS[protocol];
  const bpfProto = protoFields?.bpf ?? protocol;

  const parts: string[] = [];
  const hostParts: string[] = [];

  for (const cond of conditions) {
    const field = cond.field.toLowerCase();
    const value = cond.value;

    if (field === 'ip.addr' || field === 'ip.src' || field === 'ip.dst' || field === 'ip.host') {
      if (field === 'ip.src') {
        hostParts.push(`src host ${value}`);
      } else if (field === 'ip.dst') {
        hostParts.push(`dst host ${value}`);
      } else {
        hostParts.push(`host ${value}`);
      }
    } else if (field.includes('port')) {
      if (field.includes('src')) {
        parts.push(`src port ${value}`);
      } else if (field.includes('dst')) {
        parts.push(`dst port ${value}`);
      } else {
        parts.push(`port ${value}`);
      }
    } else if (field === 'tcp.flags' || field === 'tcp.flags.syn') {
      parts.push(`tcp[tcpflags] & tcp-syn != 0`);
    } else if (field === 'http.host' || field === 'http.request.uri') {
      parts.push(`port 80`);
    } else if (field === 'dns.qry.name') {
      parts.push(`port 53`);
    }
  }

  const allParts = [bpfProto, ...hostParts, ...parts];
  const filter = allParts.join(' and ');

  let output = '=== BPF 捕获过滤器 (tcpdump/libpcap) ===\n\n';
  output += `过滤器表达式:\n${filter}\n\n`;
  output += `--- 使用说明 ---\n`;
  output += '在 Wireshark 捕获选项或 tcpdump 中使用\n';
  output += '语法: [proto] [dir] [host|port] [value]\n';
  output += '注意: BPF 过滤器功能有限，复杂条件请用显示过滤器\n\n';
  output += '--- 常用 BPF 示例 ---\n';
  output += `  ${bpfProto}\n`;
  output += `  host 192.168.1.1\n`;
  output += `  ${bpfProto} port 80\n`;
  output += `  net 192.168.1.0/24\n`;

  return output;
}

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    toolName="Wireshark 过滤器生成器"
    paramsConfig={[
      {
        name: 'filter_type',
        label: '过滤器类型',
        type: 'select',
        default: 'display',
        options: [
          { value: 'display', label: '显示过滤器' },
          { value: 'capture', label: '捕获过滤器 (BPF)' },
        ],
      },
      {
        name: 'protocol',
        label: '协议',
        type: 'select',
        default: 'tcp',
        options: [
          { value: 'tcp', label: 'TCP' },
          { value: 'udp', label: 'UDP' },
          { value: 'http', label: 'HTTP' },
          { value: 'dns', label: 'DNS' },
          { value: 'tls', label: 'TLS/SSL' },
          { value: 'icmp', label: 'ICMP' },
          { value: 'arp', label: 'ARP' },
        ],
      },
    ]}
    execute={(
      input: string,
      _mode: string,
      params: Record<string, unknown>,
    ): string => {
      const filterType = (params.filter_type as string) || 'display';
      const protocol = (params.protocol as string) || 'tcp';
      const conditions = parseConditions(input);

      if (filterType === 'capture') {
        return generateCaptureFilter(protocol, conditions);
      }
      return generateDisplayFilter(protocol, conditions);
    }}
  />
);

export default ToolComponent;
