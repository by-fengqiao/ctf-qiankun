import { ArrowLeftRight, FileText, Link2, Menu, Search, Wrench } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useWorkbenchStore, type ViewMode } from '@/store/workbench-store';

interface TopNavProps { onMenuClick: () => void; }
const tabs: { mode: ViewMode; label: string; icon: typeof Wrench }[] = [
  { mode: 'tool', label: '工具', icon: Wrench },
  { mode: 'smart-codec', label: '智能编解码', icon: ArrowLeftRight },
  { mode: 'operation-chain', label: '操作链', icon: Link2 },
];

export default function TopNav({ onMenuClick }: TopNavProps) {
  const searchQuery = useWorkbenchStore((state) => state.searchQuery);
  const setSearchQuery = useWorkbenchStore((state) => state.setSearchQuery);
  const viewMode = useWorkbenchStore((state) => state.viewMode);
  const setViewMode = useWorkbenchStore((state) => state.setViewMode);
  return <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border bg-card px-3 md:gap-4 md:px-4"><Button variant="ghost" size="sm" onClick={onMenuClick} className="h-8 w-8 p-0 md:hidden"><Menu className="size-4" /></Button><div className="flex items-center gap-1">{tabs.map((tab) => { const Icon = tab.icon; return <button key={tab.mode} type="button" onClick={() => setViewMode(tab.mode)} className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${viewMode === tab.mode ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'}`}><Icon className="size-4" /><span className="hidden sm:inline">{tab.label}</span></button>; })}</div><div className="relative mx-auto hidden max-w-md flex-1 md:block"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="搜索工具…" className="h-8 pl-9" /></div><Button asChild variant="ghost" size="sm"><Link to="/api-docs"><FileText className="size-4" /><span className="hidden sm:inline">说明文档</span></Link></Button><span className="hidden text-xs text-muted-foreground sm:inline">开源版</span></header>;
}
