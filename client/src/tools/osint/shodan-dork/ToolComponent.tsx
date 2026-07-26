import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    toolName="Shodan/Censys/FOFA Dork 生成器"
    paramsConfig={[
      {
        name: 'platform',
        label: '平台',
        type: 'select',
        default: 'shodan',
        options: [
          { value: 'shodan', label: 'Shodan' },
          { value: 'censys', label: 'Censys' },
          { value: 'fofa', label: 'FOFA' },
          { value: 'zoomeye', label: 'ZoomEye' },
        ],
      },
    ]}
    execute={(input: string, _mode: string, params: Record<string, unknown>): string => {
      const target = input.trim();
      if (!target) return '请输入目标（IP / 域名 / 服务 / 产品 / CVE 编号）';
      const platform = (params.platform as string) || 'shodan';
      const isIp = /^\d{1,3}(\.\d{1,3}){3}$/.test(target);
      const isDomain = !isIp && /\./.test(target) && !/^CVE-/i.test(target);
      const isCve = /^CVE-\d+-\d+$/i.test(target);
      const isProduct = !isIp && !isDomain && !isCve;

      const out: string[] = ['Shodan/Censys/FOFA Dork 生成', '═'.repeat(60), ''];
      out.push(`目标: ${target}`);
      out.push(`平台: ${platform}`);
      out.push(`类型: ${isIp ? 'IP' : isDomain ? '域名' : isCve ? 'CVE 漏洞' : '产品/服务'}`);
      out.push('');

      const queries: string[] = [];
      let searchUrl = '';

      if (platform === 'shodan') {
        searchUrl = `https://www.shodan.io/search?query=`;
        if (isIp) queries.push(`ip:${target}`);
        if (isDomain) queries.push(`hostname:${target}`);
        if (isProduct) queries.push(`product:${target}`);
        if (isProduct) queries.push(`port:80 product:${target}`);
        if (isCve) queries.push(`vuln:${target}`);
        queries.push(`org:${target}`);
        queries.push(`country:"CN" ${isProduct ? `product:${target}` : target}`);
        queries.push(`port:22,80,443,3389 ${isProduct ? `product:${target}` : ''}`);
        if (isProduct) queries.push(`server: ${target}`);
        if (isProduct) queries.push(`http.title:${target}`);
      } else if (platform === 'censys') {
        searchUrl = `https://search.censys.io/search?resource=hosts&q=`;
        if (isIp) queries.push(`ip: ${target}`);
        if (isDomain) queries.push(`services.tls.certificates.leaf_data.subject.common_name: ${target}`);
        if (isProduct) queries.push(`services.software.product: ${target}`);
        if (isProduct) queries.push(`services.banner: ${target}`);
        if (isCve) queries.push(`services.software.product: ${target}`);
        queries.push(`location.country_code: CN AND ${isProduct ? `services.banner: ${target}` : target}`);
        queries.push(`services.port: 443 AND ${isProduct ? `services.banner: ${target}` : ''}`);
        if (isProduct) queries.push(`services.http.response.headers: ${target}`);
      } else if (platform === 'fofa') {
        searchUrl = `https://fofa.info/result?qbase64=`;
        if (isIp) queries.push(`ip="${target}"`);
        if (isDomain) queries.push(`domain="${target}"`);
        if (isDomain) queries.push(`host="${target}"`);
        if (isProduct) queries.push(`product="${target}"`);
        if (isProduct) queries.push(`server="${target}"`);
        if (isProduct) queries.push(`title="${target}"`);
        if (isProduct) queries.push(`body="${target}"`);
        if (isProduct) queries.push(`banner="${target}"`);
        queries.push(`country="CN" && ${isProduct ? `product="${target}"` : target}`);
        queries.push(`port="3389" && ${isProduct ? `product="${target}"` : ''}`);
      } else {
        searchUrl = `https://www.zoomeye.org/searchResult?q=`;
        if (isIp) queries.push(`ip: ${target}`);
        if (isDomain) queries.push(`site: ${target}`);
        if (isProduct) queries.push(`app: ${target}`);
        if (isProduct) queries.push(`service: ${target}`);
        if (isProduct) queries.push(`title: ${target}`);
        if (isCve) queries.push(`cve: ${target}`);
        queries.push(`country: CN AND ${isProduct ? `app: ${target}` : target}`);
        queries.push(`port: 22 AND ${isProduct ? `app: ${target}` : ''}`);
      }

      out.push(`── ${platform} 查询语句 ──`);
      for (const q of queries) {
        out.push(`  ${q}`);
      }
      out.push('', '── 可点击搜索链接 ──');
      for (const q of queries) {
        const url = platform === 'fofa'
          ? `${searchUrl}${btoa(q)}`
          : `${searchUrl}${encodeURIComponent(q)}`;
        out.push(`${q}`);
        out.push(`  → ${url}`);
      }
      out.push('', '── 平台入口 ──');
      out.push('  Shodan:  https://www.shodan.io/');
      out.push('  Censys:  https://search.censys.io/');
      out.push('  FOFA:    https://fofa.info/');
      out.push('  ZoomEye: https://www.zoomeye.org/');
      return out.join('\n');
    }}
  />
);
export default ToolComponent;
