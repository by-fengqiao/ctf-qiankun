import { useState, useMemo } from 'react';
import { Star, Clock, ChevronDown, ChevronRight } from 'lucide-react';
import { CATEGORIES, getAllTools, searchTools } from '@/tools/registry';
import type { ToolDefinition } from '@/tools/types';
import { useWorkbenchStore } from '@/store/workbench-store';
import { cn } from '@/lib/utils';
import { CATEGORY_ICONS, CATEGORY_ICON_COLORS } from './constants';
import { groupToolsByCategory, Highlight, filterDefs } from './sidebar-utils';

const MAX_DISPLAY = 10;

interface SidebarContentProps {
  onNavigate?: () => void;
}

const SidebarContent = ({ onNavigate }: SidebarContentProps) => {
  const favorites = useWorkbenchStore((s) => s.favorites);
  const recentTools = useWorkbenchStore((s) => s.recentTools);
  const searchQuery = useWorkbenchStore((s) => s.searchQuery);
  const openTool = useWorkbenchStore((s) => s.openTool);
  const toggleFavorite = useWorkbenchStore((s) => s.toggleFavorite);
  const setCategory = useWorkbenchStore((s) => s.setCategory);
  const selectedCategory = useWorkbenchStore((s) => s.selectedCategory);

  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const allTools = useMemo(() => getAllTools(), []);
  const grouped = useMemo(() => groupToolsByCategory(allTools), [allTools]);
  const searchResults = useMemo(
    () => (searchQuery.trim() ? searchTools(searchQuery) : []),
    [searchQuery]
  );

  const favTools = filterDefs(favorites).slice(0, MAX_DISPLAY);
  const recentDefs = filterDefs(recentTools).slice(0, MAX_DISPLAY);
  const isSearching = searchQuery.trim().length > 0;

  const handleOpen = (id: string, name: string) => {
    openTool(id, name);
    onNavigate?.();
  };

  const toggleCat = (catId: string) => {
    const isSelected = selectedCategory === catId;
    if (isSelected) {
      setCategory(null);
      setExpandedCats((prev) => {
        const next = new Set(prev);
        next.delete(catId);
        return next;
      });
    } else {
      setCategory(catId);
      setExpandedCats((prev) => {
        const next = new Set(prev);
        next.add(catId);
        return next;
      });
    }
  };

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const renderSearchResults = () => {
    if (searchResults.length === 0) {
      return (
        <p className="text-xs text-muted-foreground/60 px-2 py-4 text-center">
          未找到匹配工具
        </p>
      );
    }
    return searchResults.map((tool: ToolDefinition) => {
      const cat = CATEGORIES.find((c) => c.id === tool.category);
      const Icon = CATEGORY_ICONS[tool.category];
      return (
        <button
          key={tool.id}
          onClick={() => handleOpen(tool.id, tool.name)}
          className="w-full text-left px-2 py-1.5 rounded-md hover:bg-accent transition-colors"
        >
          <div className="text-xs font-medium text-foreground">
            <Highlight text={tool.name} query={searchQuery} />
          </div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground/70 mt-0.5">
            {Icon && <Icon className={cn('size-2.5', CATEGORY_ICON_COLORS[cat?.color ?? ''] ?? 'text-muted-foreground')} />}
            <span>{cat?.name}</span>
            {tool.group && (
              <>
                <ChevronRight className="size-2" />
                <span>{tool.group}</span>
              </>
            )}
          </div>
        </button>
      );
    });
  };

  const renderFavorites = () => {
    if (favTools.length === 0) return null;
    return (
      <div className="p-2 border-b border-border">
        <h3 className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-1.5 px-1">
          <Star className="size-3" />
          收藏
          {favorites.length > MAX_DISPLAY && (
            <span className="ml-auto text-[10px] text-muted-foreground/60">
              {favTools.length}/{favorites.length}
            </span>
          )}
        </h3>
        <div className="space-y-0.5">
          {favTools.map((tool: ToolDefinition) => (
            <div
              key={tool.id}
              className="group/item flex items-center gap-1 px-2 py-1 rounded-md hover:bg-accent transition-colors"
            >
              <button
                onClick={() => handleOpen(tool.id, tool.name)}
                className="flex-1 text-left text-xs text-foreground truncate"
              >
                {tool.name}
              </button>
              <button
                onClick={() => toggleFavorite(tool.id)}
                className="shrink-0 p-0.5 rounded text-warning hover:text-destructive transition-colors"
                title="取消收藏"
              >
                <Star className="size-2.5" fill="currentColor" />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderRecent = () => {
    if (recentDefs.length === 0) return null;
    return (
      <div className="p-2 border-b border-border">
        <h3 className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-1.5 px-1">
          <Clock className="size-3" />
          最近使用
          {recentTools.length > MAX_DISPLAY && (
            <span className="ml-auto text-[10px] text-muted-foreground/60">
              {recentDefs.length}/{recentTools.length}
            </span>
          )}
        </h3>
        <div className="space-y-0.5">
          {recentDefs.map((tool: ToolDefinition) => (
            <button
              key={tool.id}
              onClick={() => handleOpen(tool.id, tool.name)}
              className="w-full text-left px-2 py-1 text-xs text-foreground hover:bg-accent rounded-md transition-colors truncate"
            >
              {tool.name}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderCategoryTree = () => {
    return (
      <div className="p-2">
        <h3 className="text-xs font-semibold text-muted-foreground mb-1.5 px-1">
          工具分类
        </h3>
        <div className="space-y-0.5">
          {CATEGORIES.map((cat) => {
            const Icon = CATEGORY_ICONS[cat.id];
            const groups = grouped.get(cat.id);
            const toolCount = groups
              ? [...groups.values()].reduce((sum, arr) => sum + arr.length, 0)
              : 0;
            const expanded = expandedCats.has(cat.id);
            return (
              <div key={cat.id}>
                <button
                  onClick={() => toggleCat(cat.id)}
                  data-category-color={cat.color}
                  className={cn(
                    'w-full flex items-center gap-1.5 px-2 py-1.5 text-xs rounded-md transition-colors',
                    selectedCategory === cat.id
                      ? 'bg-accent text-accent-foreground font-medium'
                      : 'text-foreground hover:bg-accent/50'
                  )}
                >
                  {expanded ? (
                    <ChevronDown className="size-3 shrink-0" />
                  ) : (
                    <ChevronRight className="size-3 shrink-0" />
                  )}
                  {Icon && <Icon className={cn('size-3.5 shrink-0', CATEGORY_ICON_COLORS[cat.color] ?? 'text-muted-foreground')} />}
                  <span className="truncate flex-1 text-left">{cat.name}</span>
                  <span className="text-[10px] text-muted-foreground/60 shrink-0">
                    {toolCount}
                  </span>
                </button>
                {expanded && groups && (
                  <div className="ml-3 border-l border-border pl-1 mt-0.5 space-y-0.5">
                    {[...groups.entries()].map(([groupName, tools]) => {
                      const groupKey = `${cat.id}:${groupName}`;
                      const groupExpanded = expandedGroups.has(groupKey);
                      return (
                        <div key={groupName}>
                          <button
                            onClick={() => toggleGroup(groupKey)}
                            className="w-full flex items-center gap-1 px-2 py-1 text-[11px] rounded-md transition-colors text-muted-foreground hover:bg-accent/50"
                          >
                            {groupExpanded ? (
                              <ChevronDown className="size-2.5 shrink-0" />
                            ) : (
                              <ChevronRight className="size-2.5 shrink-0" />
                            )}
                            <span className="truncate flex-1 text-left">
                              {groupName}
                            </span>
                            <span className="text-[10px] text-muted-foreground/50 shrink-0">
                              {tools.length}
                            </span>
                          </button>
                          {groupExpanded && (
                            <div className="ml-3 space-y-0.5">
                              {tools.map((tool: ToolDefinition) => (
                                <button
                                  key={tool.id}
                                  onClick={() => handleOpen(tool.id, tool.name)}
                                  className="w-full text-left px-2 py-1 text-[11px] text-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors truncate"
                                >
                                  {tool.name}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-1 overflow-y-auto min-h-0">
        {isSearching ? (
          <div className="p-2 space-y-0.5">{renderSearchResults()}</div>
        ) : (
          <>
            {renderFavorites()}
            {renderRecent()}
            {renderCategoryTree()}
          </>
        )}
      </div>
    </div>
  );
};

const Sidebar = () => {
  return (
    <aside className="hidden md:flex w-56 shrink-0 border-r border-border bg-card">
      <SidebarContent />
    </aside>
  );
};

export { SidebarContent };
export default Sidebar;
