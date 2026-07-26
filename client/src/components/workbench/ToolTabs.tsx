import { X } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type { TabState } from '@/store/workbench-store';

interface ToolTabsProps {
  tabs: TabState[];
  activeTabId: string | null;
  onSwitch: (id: string) => void;
  onClose: (id: string) => void;
}

const ToolTabs = ({ tabs, activeTabId, onSwitch, onClose }: ToolTabsProps) => {
  if (tabs.length === 0) return null;

  return (
    <Tabs
      value={activeTabId ?? undefined}
      onValueChange={(v: string) => onSwitch(v)}
      className="w-full"
    >
      <TabsList className="h-auto bg-transparent p-0 rounded-none border-b border-border w-full justify-start overflow-x-auto">
        {tabs.map((tab: TabState) => (
          <TabsTrigger
            key={tab.toolId}
            value={tab.toolId}
            className="group gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none whitespace-nowrap"
          >
            <span className="truncate max-w-32">{tab.toolName}</span>
            <span
              role="button"
              tabIndex={0}
              aria-label="关闭标签"
              onPointerDown={(e: React.PointerEvent) => { e.stopPropagation(); e.preventDefault(); }}
              onClick={(e: React.MouseEvent) => { e.stopPropagation(); onClose(tab.toolId); }}
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); onClose(tab.toolId); }
              }}
              className={cn(
                'opacity-40 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive',
                'rounded p-0.5 transition-opacity cursor-pointer'
              )}
            >
              <X className="size-3" />
            </span>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
};

export default ToolTabs;
