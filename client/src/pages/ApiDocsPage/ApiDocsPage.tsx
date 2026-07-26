import { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, ChevronLeft, Code2, FileText, Globe2, Layers3, Menu, ShieldCheck, Sparkles, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { CATEGORIES, getToolsByCategory } from '@/tools/registry';
import type { ToolCategory } from '@/tools/types';

type Article = { title: string; lead: string; sections: Array<{ title: string; text?: string; bullets?: string[] }> };

const articles: Record<string, Article> = {
  'quick-start': {
    title: '快速开始', lead: 'CTF 乾坤袋开源版是一个纯浏览器端工具工作台。',
    sections: [
      { title: '直接使用', text: '从左侧分类或顶部搜索选择工具，填写输入内容后执行。编码、文本、文件和图片等工具会在浏览器中处理。' },
      { title: '核心模式', bullets: ['工具工作台：快速完成单步处理。', '智能编解码：识别并尝试常见编码和转义。', '操作链：组合多个步骤并保存为本地配方。'] },
    ],
  },
  workspace: {
    title: '工具工作台', lead: '工具按方向分类，并支持名称、关键词和拼音搜索。',
    sections: [
      { title: '文件处理', text: '工具需要文件时会在页面提示。请只处理你有权分析的文件，并避免在不受信任环境中使用真实敏感样本。' },
      { title: '结果判断', text: '输出仅提供分析辅助，尤其是自动解码、密码学和安全检测结果，需要结合上下文自行复核。' },
    ],
  },
  'smart-codec': {
    title: '智能编解码', lead: '帮助识别 Base、Hex、URL、Unicode 等常见编码与转义形式。',
    sections: [
      { title: '推荐做法', text: '从原始输入开始逐层确认。出现可读文本并不代表已经完成解码，应结合题目格式和上下文验证。' },
      { title: '适用场景', bullets: ['未知文本的快速试探。', '多层编码的分步还原。', '常用编码之间的相互转换。'] },
    ],
  },
  'operation-chain': {
    title: '操作链', lead: '把多步处理流程组合成可复用的本地配方。',
    sections: [
      { title: '使用流程', text: '添加操作步骤，调整顺序，填写初始内容并运行；每一步都保留中间结果，方便检查错误位置。' },
      { title: '本地保存', text: '配方保存于当前浏览器环境。清除站点数据或更换浏览器前，请自行导出或记录重要流程。' },
    ],
  },
  deploy: {
    title: '静态部署', lead: '开源版没有服务端，可部署到任意静态托管服务。',
    sections: [
      { title: '构建', text: '执行 npm install 后运行 npm run build，发布 dist 目录中的全部文件。' },
      { title: 'Nginx', text: '单页应用需要将未知路径回退到 index.html：try_files $uri $uri/ /index.html;' },
      { title: 'GitHub Pages', text: '使用自定义域名可直接发布。若部署在 /仓库名/ 子路径，请在 vite.config.ts 中配置 base 后重新构建。' },
    ],
  },
  develop: {
    title: '二次开发', lead: '工具实现集中在 client/src/tools/，元数据由工具注册表统一加载。',
    sections: [
      { title: '新增工具', bullets: ['复制同类别的工具目录作为起点。', '补充名称、关键词、输入校验和错误反馈。', '坚持本地执行原则，不默认新增远程请求。', '运行 npm run type:check 与 npm run build 验证。'] },
      { title: '本地调试', text: '使用 npm run dev 启动开发服务器；默认地址为 http://localhost:5173。' },
    ],
  },
  privacy: {
    title: '安全与隐私', lead: '开源版本身不提供项目服务器、账号系统或数据库。',
    sections: [
      { title: '数据边界', text: '工具输入不会被项目主动上传到服务器。你自行加入的统计、CDN、第三方脚本或代理服务可能改变这一边界。' },
      { title: '使用边界', bullets: ['仅用于合法授权的学习、比赛和安全测试。', '不要在不受信任设备中处理真实密钥、令牌或敏感样本。', '不要将工具用于未授权扫描、攻击或数据获取。'] },
    ],
  },
  about: {
    title: '关于开源版', lead: '开源版保留客户端工具能力，供学习、二次开发与自行部署使用。',
    sections: [
      { title: '作者', bullets: ['枫桥 / by-fengqiao：https://github.com/by-fengqiao', 'dzwm：https://github.com/dzwm'] },
      { title: '许可证', text: '本项目使用 MIT 许可证。' },
    ],
  },
};

const navItems = [
  { id: 'quick-start', label: '快速开始', icon: Sparkles },
  { id: 'workspace', label: '工具工作台', icon: Wrench },
  { id: 'smart-codec', label: '智能编解码', icon: Layers3 },
  { id: 'operation-chain', label: '操作链', icon: FileText },
  { id: 'deploy', label: '静态部署', icon: Globe2 },
  { id: 'develop', label: '二次开发', icon: Code2 },
  { id: 'privacy', label: '安全与隐私', icon: ShieldCheck },
  { id: 'about', label: '关于开源版', icon: BookOpen },
];

function ToolManual({ category }: { category: ToolCategory }) {
  const config = CATEGORIES.find((item) => item.id === category);
  const tools = useMemo(() => getToolsByCategory(category), [category]);
  if (!config) return null;
  return <article><h1 className="text-3xl font-semibold tracking-tight">{config.name}</h1><p className="mt-3 text-muted-foreground">{config.description}</p><p className="mt-2 text-sm text-muted-foreground">共收录 {tools.length} 个工具</p><div className="mt-8 space-y-3">{tools.map((tool) => <details key={tool.id} className="rounded-xl border bg-card px-4 py-3"><summary className="cursor-pointer font-medium">{tool.name}<span className="ml-2 text-xs font-normal text-muted-foreground">{tool.id}</span></summary><p className="mt-3 text-sm text-muted-foreground">{tool.description || '请根据工具页面的输入提示执行。'}</p>{tool.exampleInput && <code className="mt-3 block break-all rounded bg-muted p-3 text-xs">{tool.exampleInput}</code>}</details>)}</div></article>;
}

function ArticleView({ article }: { article: Article }) {
  return <article><h1 className="text-3xl font-semibold tracking-tight">{article.title}</h1><p className="mt-3 text-base leading-7 text-muted-foreground">{article.lead}</p><div className="mt-9 space-y-8">{article.sections.map((section) => <section key={section.title}><h2 className="text-xl font-semibold">{section.title}</h2>{section.text && <p className="mt-3 leading-7 text-muted-foreground">{section.text}</p>}{section.bullets && <ul className="mt-3 list-disc space-y-2 pl-5 leading-7 text-muted-foreground">{section.bullets.map((item) => <li key={item}>{item}</li>)}</ul>}</section>)}</div></article>;
}

export default function ApiDocsPage() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const path = location.pathname.replace(/^\/api-docs\/?/, '') || 'quick-start';
  const category = path.startsWith('tools/') ? path.slice('tools/'.length) as ToolCategory : null;
  const sidebar = <nav className="space-y-5"><div className="space-y-1">{navItems.map((item) => <Link key={item.id} to={`/api-docs/${item.id}`} onClick={() => setMobileOpen(false)} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${path === item.id ? 'bg-accent font-medium text-foreground' : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'}`}><item.icon className="size-4" />{item.label}</Link>)}</div><div className="border-t pt-4"><p className="px-3 pb-2 text-xs font-semibold text-muted-foreground">工具手册</p><div className="space-y-1">{CATEGORIES.map((item) => <Link key={item.id} to={`/api-docs/tools/${item.id}`} onClick={() => setMobileOpen(false)} className={`block rounded-lg px-3 py-1.5 text-sm ${path === `tools/${item.id}` ? 'bg-accent font-medium text-foreground' : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'}`}>{item.name}</Link>)}</div></div></nav>;
  return <div className="min-h-screen bg-background"><header className="flex h-14 items-center gap-3 border-b bg-card px-4"><Button asChild variant="ghost" size="sm"><Link to="/"><ChevronLeft className="size-4" /><span className="hidden sm:inline">返回工具台</span></Link></Button><h1 className="text-base font-semibold">说明文档</h1><div className="flex-1" /><Sheet open={mobileOpen} onOpenChange={setMobileOpen}><Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(true)}><Menu className="size-4" /></Button><SheetContent side="left" className="w-72 overflow-y-auto"><SheetHeader><SheetTitle>说明文档</SheetTitle></SheetHeader><div className="mt-5">{sidebar}</div></SheetContent></Sheet></header><div className="mx-auto flex max-w-7xl"><aside className="hidden w-64 shrink-0 border-r p-4 md:block">{sidebar}</aside><main className="min-w-0 flex-1 px-6 py-9 md:px-10">{category ? <ToolManual category={category} /> : <ArticleView article={articles[path] ?? articles['quick-start']} />}</main></div></div>;
}
