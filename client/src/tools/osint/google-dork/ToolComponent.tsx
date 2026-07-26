import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    toolName="Google Dork 生成器"
    paramsConfig={[
      {
        name: 'target_type',
        label: '目标类型',
        type: 'select',
        default: 'domain',
        options: [
          { value: 'domain', label: '域名' },
          { value: 'email', label: '邮箱' },
          { value: 'person', label: '人名' },
        ],
      },
      {
        name: 'intent',
        label: '搜索意图',
        type: 'select',
        default: 'admin',
        options: [
          { value: 'admin', label: '管理后台' },
          { value: 'leak', label: '信息泄露' },
          { value: 'files', label: '敏感文件' },
          { value: 'dirs', label: '目录探测' },
        ],
      },
    ]}
    execute={(input: string, _mode: string, params: Record<string, unknown>): string => {
      const target = input.trim();
      if (!target) return '请输入目标（域名 / 邮箱 / 人名）';
      const targetType = (params.target_type as string) || 'domain';
      const intent = (params.intent as string) || 'admin';
      const isDomain = targetType === 'domain';
      const isEmail = targetType === 'email';
      const domain = isEmail ? target.split('@').pop() ?? target : target;
      const out: string[] = ['Google Dork 生成结果', '═'.repeat(60), ''];
      out.push(`目标: ${target}`);
      out.push(`类型: ${targetType}`);
      out.push(`意图: ${intent}`);
      out.push('');

      const buildQuery = (q: string): string => `https://www.google.com/search?q=${encodeURIComponent(q)}`;
      const queries: string[] = [];

      if (isDomain || isEmail) {
        out.push(`── 站点限定: site:${domain} ──`);
        if (intent === 'admin') {
          queries.push(`site:${domain} inurl:admin OR inurl:login OR inurl:dashboard`);
          queries.push(`site:${domain} intitle:"admin" OR intitle:"login" OR intitle:"控制台"`);
          queries.push(`site:${domain} inurl:wp-admin OR inurl:administrator OR inurl:manage`);
          queries.push(`site:${domain} inurl:signin OR inurl:signup OR inurl:register`);
        }
        if (intent === 'leak') {
          queries.push(`site:${domain} intext:"password" OR intext:"密码" OR intext:"账号"`);
          queries.push(`site:${domain} intext:"BEGIN PGP" OR intext:"PRIVATE KEY"`);
          queries.push(`site:${domain} intext:"index of" OR intext:"parent directory"`);
          queries.push(`site:${domain} intext:"sql syntax" OR intext:"mysql_fetch" OR intext:"ORA-"`);
          queries.push(`site:${domain} intext:"stack trace" OR intext:"debug" OR intext:"error"`);
        }
        if (intent === 'files') {
          const exts = ['pdf', 'xls', 'xlsx', 'doc', 'docx', 'ppt', 'pptx', 'txt', 'csv', 'sql', 'bak', 'zip', 'rar', 'tar.gz', 'log', 'conf', 'env'];
          for (const ext of exts) {
            queries.push(`site:${domain} filetype:${ext}`);
          }
          queries.push(`site:${domain} ext:bkf OR ext:old OR ext:backup`);
        }
        if (intent === 'dirs') {
          queries.push(`site:${domain} inurl:/admin/`);
          queries.push(`site:${domain} inurl:/backup/ OR inurl:/old/`);
          queries.push(`site:${domain} inurl:/api/ OR inurl:/v1/ OR inurl:/v2/`);
          queries.push(`site:${domain} inurl:/config/ OR inurl:/conf/`);
          queries.push(`site:${domain} inurl:/test/ OR inurl:/dev/ OR inurl:/debug/`);
          queries.push(`site:${domain} inurl:/uploads/ OR inurl:/files/`);
          queries.push(`site:${domain} intitle:"index of"`);
        }
        queries.push(`site:${domain} -www`);
        queries.push(`site:*.${domain}`);
        queries.push(`site:${domain} inurl:wp-content OR inurl:joomla OR inurl:drupal`);
      }

      if (isEmail) {
        out.push('', `── 邮箱相关: ${target} ──`);
        queries.push(`"${target}"`);
        queries.push(`intext:"${target}"`);
        queries.push(`site:pastebin.com "${target}"`);
        queries.push(`site:github.com "${target}"`);
        queries.push(`"${target}" filetype:pdf OR filetype:doc`);
        const user = target.split('@')[0] ?? target;
        queries.push(`"${user}" "${domain}"`);
      }

      if (targetType === 'person') {
        out.push('', `── 人名相关: ${target} ──`);
        queries.push(`"${target}"`);
        queries.push(`"${target}" site:linkedin.com OR site:facebook.com OR site:twitter.com`);
        queries.push(`"${target}" site:github.com OR site:gitlab.com`);
        queries.push(`"${target}" filetype:pdf OR filetype:doc`);
        queries.push(`"${target}" intext:"email" OR intext:"contact" OR intext:"phone"`);
        queries.push(`"${target}" site:pastebin.com`);
        queries.push(`"${target}" intext:"resume" OR intext:"CV" OR intext:"简历"`);
      }

      out.push('── 可点击查询链接 ──');
      for (const q of queries) {
        out.push(`${q}`);
        out.push(`  → ${buildQuery(q)}`);
        out.push('');
      }

      return out.join('\n');
    }}
  />
);
export default ToolComponent;
