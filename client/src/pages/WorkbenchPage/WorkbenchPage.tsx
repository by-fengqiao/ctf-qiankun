import { useMemo, useState } from 'react';
import { useWorkbenchStore } from '@/store/workbench-store';
import { getAllTools, searchTools } from '@/tools/registry';
import SmartCodecPanel from '@/components/workbench/SmartCodec/SmartCodecPanel';
import OperationChainPanel from '@/components/workbench/OperationChain/OperationChainPanel';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import TopNav from './TopNav';
import Sidebar, { SidebarContent } from './Sidebar';
import WorkArea from './WorkArea';

const WorkbenchPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const searchQuery = useWorkbenchStore((s) => s.searchQuery);
  const selectedCategory = useWorkbenchStore((s) => s.selectedCategory);
  const viewMode = useWorkbenchStore((s) => s.viewMode);

  const filteredTools = useMemo(() => {
    let tools = searchQuery.trim() ? searchTools(searchQuery) : getAllTools();
    if (selectedCategory) tools = tools.filter((t) => t.category === selectedCategory);
    return tools;
  }, [searchQuery, selectedCategory]);

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <TopNav onMenuClick={() => setSidebarOpen(true)} />
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="flex w-64 flex-col p-0">
            <SheetHeader className="shrink-0 border-b border-border px-3 py-2">
              <SheetTitle className="text-sm font-medium">工具导航</SheetTitle>
            </SheetHeader>
            <div className="min-h-0 flex-1">
              <SidebarContent onNavigate={() => setSidebarOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>
        <div className="flex min-h-0 flex-1 flex-col">
          {viewMode === 'tool' && <WorkArea filteredTools={filteredTools} />}
          {viewMode === 'smart-codec' && <SmartCodecPanel />}
          {viewMode === 'operation-chain' && <OperationChainPanel />}
        </div>
      </div>
    </div>
  );
};

export default WorkbenchPage;
