import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const SENSITIVE_PATHS: string[] = [
  '/admin', '/admin/login', '/administrator', '/wp-admin', '/wp-login.php',
  '/backup', '/backup.zip', '/backup.sql', '/backup.tar.gz', '/db.sql',
  '/.git', '/.git/config', '/.git/HEAD', '/.git/index',
  '/.env', '/.env.local', '/.env.production',
  '/.svn', '/.svn/entries', '/.svn/wc.db',
  '/.htaccess', '/.htpasswd',
  '/config.php', '/config.json', '/config.yml', '/config.ini',
  '/phpinfo.php', '/info.php', '/test.php',
  '/.DS_Store', '/robots.txt', '/sitemap.xml',
  '/api', '/api/v1', '/api/docs', '/swagger', '/swagger-ui',
  '/console', '/debug', '/test', '/dev',
  '/uploads', '/files', '/static', '/public',
  '/.well-known/security.txt',
  '/server-status', '/server-info',
  '/phpmyadmin', '/pma', '/mysqladmin',
  '/login', '/signin', '/register',
  '/.aws', '/.aws/credentials',
  '/.ssh', '/.ssh/id_rsa',
  '/flag', '/flag.txt', '/flag.php',
];

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    toolName="Wayback Machine 工具"
    execute={(input: string): string => {
      const raw = input.trim();
      if (!raw) return '请输入 URL 或域名（如 https://example.com 或 example.com）';
      const domain = raw.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
      const baseUrl = raw.startsWith('http') ? raw : `https://${raw}`;
      const out: string[] = ['Wayback Machine 工具', '═'.repeat(60), ''];
      out.push(`目标: ${baseUrl}`);
      out.push(`域名: ${domain}`);
      out.push('');

      out.push('── 基础查询 ──');
      out.push('主页:');
      out.push(`  → https://web.archive.org/web/*/${domain}/*`);
      out.push('日历视图:');
      out.push(`  → https://web.archive.org/web/2*/${domain}`);
      out.push('最新快照:');
      out.push(`  → https://web.archive.org/web/2/${baseUrl}`);
      out.push('保存当前页:');
      out.push(`  → https://web.archive.org/save/${baseUrl}`);
      out.push('');

      out.push('── CDX API ──');
      out.push('所有快照:');
      out.push(`  → http://web.archive.org/cdx/search/cdx?url=${domain}/*&output=json&limit=100`);
      out.push('指定 URL 快照:');
      out.push(`  → http://web.archive.org/cdx/search/cdx?url=${baseUrl}&output=json`);
      out.push('含时间范围 (2018-2024):');
      out.push(`  → http://web.archive.org/cdx/search/cdx?url=${domain}/*&from=2018&to=2024&output=json`);
      out.push('按时间倒序:');
      out.push(`  → http://web.archive.org/cdx/search/cdx?url=${domain}/*&output=json&limit=100&filter=statuscode:200`);
      out.push('仅 200 状态:');
      out.push(`  → http://web.archive.org/cdx/search/cdx?url=${domain}/*&output=json&limit=200&filter=statuscode:200&fl=timestamp,original,statuscode`);
      out.push('');

      out.push('── 敏感路径历史快照 ──');
      for (const path of SENSITIVE_PATHS) {
        const fullUrl = `${baseUrl}${path}`;
        out.push(`${path}`);
        out.push(`  → https://web.archive.org/web/*/${fullUrl}`);
      }
      out.push('');

      out.push('── CDX 批量查询敏感路径 ──');
      out.push('可用脚本批量查询:');
      out.push(`  for p in admin backup .git .env; do`);
      out.push(`    curl -s "http://web.archive.org/cdx/search/cdx?url=${baseUrl}/$p/*&output=json&limit=5"`);
      out.push(`  done`);
      out.push('');

      out.push('── 其他归档服务 ──');
      out.push('archive.today:');
      out.push(`  → https://archive.ph/${baseUrl}`);
      out.push(`  → https://archive.ph/newest/${baseUrl}`);
      out.push('Curlie:');
      out.push(`  → https://curlie.org/search?q=${domain}`);
      out.push('Common Crawl:');
      out.push(`  → https://commoncrawl.org/`);
      out.push('');

      out.push('── 使用建议 ──');
      out.push('1. CDX API 获取快照时间戳列表');
      out.push('2. 用 https://web.archive.org/web/<timestamp>/<url> 访问特定快照');
      out.push('3. 检查 .git/.env 等历史快照可能发现敏感信息泄露');
      out.push('4. 比较不同时间点快照可发现页面变更');
      return out.join('\n');
    }}
  />
);
export default ToolComponent;
