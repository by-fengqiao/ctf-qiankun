import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

interface Platform {
  name: string;
  url: string;
  category: string;
}

const PLATFORMS: Platform[] = [
  { name: 'GitHub', url: 'https://github.com/{u}', category: '开发' },
  { name: 'GitLab', url: 'https://gitlab.com/{u}', category: '开发' },
  { name: 'Bitbucket', url: 'https://bitbucket.org/{u}', category: '开发' },
  { name: 'npm', url: 'https://www.npmjs.com/~{u}', category: '开发' },
  { name: 'PyPI', url: 'https://pypi.org/user/{u}', category: '开发' },
  { name: 'Replit', url: 'https://replit.com/@{u}', category: '开发' },
  { name: 'HackerNews', url: 'https://news.ycombinator.com/user?id={u}', category: '开发' },
  { name: 'Twitter/X', url: 'https://twitter.com/{u}', category: '社交' },
  { name: 'Instagram', url: 'https://www.instagram.com/{u}', category: '社交' },
  { name: 'Facebook', url: 'https://www.facebook.com/{u}', category: '社交' },
  { name: 'TikTok', url: 'https://www.tiktok.com/@{u}', category: '社交' },
  { name: 'Snapchat', url: 'https://www.snapchat.com/add/{u}', category: '社交' },
  { name: 'Pinterest', url: 'https://www.pinterest.com/{u}', category: '社交' },
  { name: 'Tumblr', url: 'https://{u}.tumblr.com', category: '社交' },
  { name: 'LinkedIn', url: 'https://www.linkedin.com/in/{u}', category: '社交' },
  { name: 'Reddit', url: 'https://www.reddit.com/user/{u}', category: '社交' },
  { name: 'Telegram', url: 'https://t.me/{u}', category: '社交' },
  { name: 'VK', url: 'https://vk.com/{u}', category: '社交' },
  { name: 'Mastodon', url: 'https://mastodon.social/@{u}', category: '社交' },
  { name: 'YouTube', url: 'https://www.youtube.com/@{u}', category: '媒体' },
  { name: 'Twitch', url: 'https://www.twitch.tv/{u}', category: '媒体' },
  { name: 'Vimeo', url: 'https://vimeo.com/{u}', category: '媒体' },
  { name: 'SoundCloud', url: 'https://soundcloud.com/{u}', category: '媒体' },
  { name: 'Spotify', url: 'https://open.spotify.com/user/{u}', category: '媒体' },
  { name: 'TikTok', url: 'https://www.tiktok.com/@{u}', category: '媒体' },
  { name: 'Medium', url: 'https://medium.com/@{u}', category: '博客' },
  { name: 'WordPress', url: 'https://{u}.wordpress.com', category: '博客' },
  { name: 'Blogger', url: 'https://{u}.blogspot.com', category: '博客' },
  { name: 'Dev.to', url: 'https://dev.to/{u}', category: '博客' },
  { name: 'Behance', url: 'https://www.behance.net/{u}', category: '设计' },
  { name: 'Dribbble', url: 'https://dribbble.com/{u}', category: '设计' },
  { name: 'DeviantArt', url: 'https://www.deviantart.com/{u}', category: '设计' },
  { name: 'Flickr', url: 'https://www.flickr.com/people/{u}', category: '设计' },
  { name: 'Steam', url: 'https://steamcommunity.com/id/{u}', category: '游戏' },
  { name: 'Roblox', url: 'https://www.roblox.com/user.aspx?username={u}', category: '游戏' },
  { name: 'Keybase', url: 'https://keybase.io/{u}', category: '安全' },
  { name: 'Patreon', url: 'https://www.patreon.com/{u}', category: '其他' },
  { name: 'Product Hunt', url: 'https://www.producthunt.com/@{u}', category: '其他' },
  { name: 'About.me', url: 'https://about.me/{u}', category: '其他' },
];

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    toolName="用户名枚举"
    execute={(input: string): string => {
      const username = input.trim();
      if (!username) return '请输入要查询的用户名';
      const out: string[] = ['用户名枚举查询链接', '═'.repeat(60), ''];
      out.push(`用户名: ${username}`);
      out.push(`平台数: ${PLATFORMS.length}`);
      out.push('（以下为查询链接，点击即可在新标签打开验证，工具不发起实际请求）');
      out.push('');

      const categories = new Map<string, Platform[]>();
      for (const p of PLATFORMS) {
        const arr = categories.get(p.category) ?? [];
        arr.push(p);
        categories.set(p.category, arr);
      }
      for (const [cat, list] of categories) {
        out.push(`── ${cat} (${list.length}) ──`);
        for (const p of list) {
          const url = p.url.replace('{u}', username);
          out.push(`${p.name}`);
          out.push(`  → ${url}`);
        }
        out.push('');
      }
      out.push('── 批量查询 ──');
      out.push(`Sherlock (CLI): sherlock ${username}`);
      out.push(`WhatsMyName: https://whatsmyname.app/`);
      out.push(`Namechk: https://namechk.com/`);
      return out.join('\n');
    }}
  />
);
export default ToolComponent;
