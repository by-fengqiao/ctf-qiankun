import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const RECORD_TYPES: Record<string, string> = {
  A: 'IPv4 地址记录，将域名映射到 IPv4 地址',
  AAAA: 'IPv6 地址记录，将域名映射到 IPv6 地址',
  CNAME: '规范名称记录，将域名别名指向另一个域名',
  MX: '邮件交换记录，指定接收邮件的服务器',
  TXT: '文本记录，存储任意文本信息（如 SPF、DKIM）',
  NS: '名称服务器记录，指定域的权威 DNS 服务器',
  SOA: '权威记录开始，包含域的管理信息',
  SRV: '服务记录，指定服务的端口和主机',
  PTR: '指针记录，反向 DNS 解析（IP → 域名）',
  CAA: '证书颁发机构授权记录',
};

const parseDNSLine = (line: string): string[] => {
  const tokens = line.trim().split(/\s+/).filter(Boolean);
  return tokens;
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      const lines = input.trim().split('\n').filter((l) => l.trim());
      if (lines.length === 0) {
        throw new Error('请输入 DNS 记录');
      }
      const results = lines.map((line: string, idx: number) => {
        const tokens = parseDNSLine(line);
        if (tokens.length < 2) {
          return `[${idx + 1}] 无法解析: ${line}`;
        }
        const name = tokens[0];
        let ttl = '';
        let cls = '';
        let typeIdx = 1;
        if (tokens.length >= 4 && /^\d+$/.test(tokens[1])) {
          ttl = tokens[1];
          cls = tokens[2];
          typeIdx = 3;
        } else if (tokens.length >= 3 && /^\d+$/.test(tokens[1])) {
          ttl = tokens[1];
          typeIdx = 2;
        }
        const type = tokens[typeIdx]?.toUpperCase() ?? '';
        const value = tokens.slice(typeIdx + 1).join(' ');
        const desc = RECORD_TYPES[type] ?? '未知记录类型';
        return [
          `[${idx + 1}] ${line}`,
          `  名称: ${name}`,
          ttl ? `  TTL: ${ttl}` : '',
          cls ? `  类: ${cls}` : '',
          `  类型: ${type}`,
          `  值: ${value}`,
          `  说明: ${desc}`,
        ].filter(Boolean).join('\n');
      });
      return results.join('\n\n');
    }}
  />
);

export default ToolComponent;
