import type { ToolDefinition } from '@/tools/types';
import ToolCard from '@/components/workbench/ToolCard';
import { CATEGORY_ICONS, CATEGORY_CARD_COLORS } from './constants';

interface ToolGridProps {
  tools: ToolDefinition[];
  onOpenTool: (toolId: string, toolName: string) => void;
}

const ToolGrid = ({ tools, onOpenTool }: ToolGridProps) => {
  if (tools.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
        <p className="text-sm">未找到匹配的工具</p>
        <p className="text-xs text-muted-foreground/60">
          试试调整搜索词或选择其他分类
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 overflow-y-auto" data-ai-section-type="card-list">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {tools.map((tool: ToolDefinition) => {
          const Icon = CATEGORY_ICONS[tool.category];
          const colorClass = CATEGORY_CARD_COLORS[tool.category];
          return (
            <ToolCard
              key={tool.id}
              toolId={tool.id}
              name={tool.name}
              description={tool.keywords.join(' · ')}
              icon={Icon ? <Icon className="size-5" /> : undefined}
              iconColorClass={colorClass}
              onClick={() => onOpenTool(tool.id, tool.name)}
            />
          );
        })}
      </div>
    </div>
  );
};

export default ToolGrid;
