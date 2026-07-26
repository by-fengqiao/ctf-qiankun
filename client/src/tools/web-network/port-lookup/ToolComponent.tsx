import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

interface PortInfo {
  name: string;
  proto: string;
  desc: string;
}

const PORTS: Record<string, PortInfo> = {
  '20': { name: 'FTP-DATA', proto: 'TCP', desc: 'FTP 数据传输' },
  '21': { name: 'FTP', proto: 'TCP', desc: 'FTP 控制连接' },
  '22': { name: 'SSH', proto: 'TCP', desc: 'SSH 远程登录' },
  '23': { name: 'Telnet', proto: 'TCP', desc: 'Telnet 远程登录' },
  '25': { name: 'SMTP', proto: 'TCP', desc: 'SMTP 邮件传输' },
  '53': { name: 'DNS', proto: 'UDP/TCP', desc: 'DNS 域名解析' },
  '67': { name: 'DHCP', proto: 'UDP', desc: 'DHCP 服务端' },
  '68': { name: 'DHCP', proto: 'UDP', desc: 'DHCP 客户端' },
  '69': { name: 'TFTP', proto: 'UDP', desc: '简单文件传输' },
  '80': { name: 'HTTP', proto: 'TCP', desc: 'HTTP Web 服务' },
  '110': { name: 'POP3', proto: 'TCP', desc: 'POP3 邮件接收' },
  '111': { name: 'RPC', proto: 'TCP/UDP', desc: 'RPC 端口映射' },
  '119': { name: 'NNTP', proto: 'TCP', desc: '网络新闻传输' },
  '123': { name: 'NTP', proto: 'UDP', desc: '网络时间协议' },
  '135': { name: 'MS-RPC', proto: 'TCP', desc: 'Windows RPC' },
  '137': { name: 'NetBIOS', proto: 'UDP', desc: 'NetBIOS 名称' },
  '138': { name: 'NetBIOS', proto: 'UDP', desc: 'NetBIOS 数据报' },
  '139': { name: 'NetBIOS', proto: 'TCP', desc: 'NetBIOS 会话' },
  '143': { name: 'IMAP', proto: 'TCP', desc: 'IMAP 邮件接收' },
  '161': { name: 'SNMP', proto: 'UDP', desc: 'SNMP 网络管理' },
  '162': { name: 'SNMP-TRAP', proto: 'UDP', desc: 'SNMP 陷阱' },
  '389': { name: 'LDAP', proto: 'TCP', desc: 'LDAP 目录访问' },
  '443': { name: 'HTTPS', proto: 'TCP', desc: 'HTTPS 加密 Web' },
  '445': { name: 'SMB', proto: 'TCP', desc: 'SMB 文件共享' },
  '465': { name: 'SMTPS', proto: 'TCP', desc: 'SMTP over SSL' },
  '514': { name: 'Syslog', proto: 'UDP', desc: '系统日志' },
  '587': { name: 'SMTP', proto: 'TCP', desc: 'SMTP 邮件提交' },
  '636': { name: 'LDAPS', proto: 'TCP', desc: 'LDAP over SSL' },
  '873': { name: 'rsync', proto: 'TCP', desc: 'rsync 同步' },
  '993': { name: 'IMAPS', proto: 'TCP', desc: 'IMAP over SSL' },
  '995': { name: 'POP3S', proto: 'TCP', desc: 'POP3 over SSL' },
  '1080': { name: 'SOCKS', proto: 'TCP', desc: 'SOCKS 代理' },
  '1433': { name: 'MSSQL', proto: 'TCP', desc: 'MS SQL Server' },
  '1521': { name: 'Oracle', proto: 'TCP', desc: 'Oracle 数据库' },
  '1723': { name: 'PPTP', proto: 'TCP', desc: 'PPTP VPN' },
  '2049': { name: 'NFS', proto: 'TCP/UDP', desc: 'NFS 文件系统' },
  '3306': { name: 'MySQL', proto: 'TCP', desc: 'MySQL 数据库' },
  '3389': { name: 'RDP', proto: 'TCP', desc: 'Windows 远程桌面' },
  '5432': { name: 'PostgreSQL', proto: 'TCP', desc: 'PostgreSQL 数据库' },
  '5900': { name: 'VNC', proto: 'TCP', desc: 'VNC 远程桌面' },
  '6379': { name: 'Redis', proto: 'TCP', desc: 'Redis 缓存' },
  '8080': { name: 'HTTP-Alt', proto: 'TCP', desc: 'HTTP 备用端口' },
  '8443': { name: 'HTTPS-Alt', proto: 'TCP', desc: 'HTTPS 备用端口' },
  '9200': { name: 'Elasticsearch', proto: 'TCP', desc: 'Elasticsearch HTTP' },
  '11211': { name: 'Memcached', proto: 'TCP', desc: 'Memcached 缓存' },
  '27017': { name: 'MongoDB', proto: 'TCP', desc: 'MongoDB 数据库' },
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      const port = input.trim();
      if (!port) {
        const all = Object.entries(PORTS).map(
          ([p, info]) => `${p}/${info.proto}\t${info.name}\t${info.desc}`,
        );
        return `请输入端口号查询。\n\n常见端口列表:\n\n${all.join('\n')}`;
      }
      const info = PORTS[port];
      if (!info) {
        const portNum = parseInt(port, 10);
        if (isNaN(portNum) || portNum < 0 || portNum > 65535) {
          throw new Error('端口号应在 0-65535 之间');
        }
        const range = portNum <= 1023 ? '知名端口 (0-1023)' : portNum <= 49151 ? '注册端口 (1024-49151)' : '动态端口 (49152-65535)';
        return `端口 ${port} 不在常见列表中。\n\n端口范围: ${range}`;
      }
      return [
        `端口: ${port}`,
        `服务: ${info.name}`,
        `协议: ${info.proto}`,
        `说明: ${info.desc}`,
      ].join('\n');
    }}
  />
);

export default ToolComponent;
