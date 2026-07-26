import type { ReactNode } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWorkbenchStore } from '@/store/workbench-store';

interface ToolCardProps {
  toolId: string;
  name: string;
  description: string;
  icon?: ReactNode;
  iconColorClass?: string;
  onClick: () => void;
}

const ToolCard = ({ toolId, name, description, icon, iconColorClass, onClick }: ToolCardProps) => {
  const favorites = useWorkbenchStore((s) => s.favorites);
  const toggleFavorite = useWorkbenchStore((s) => s.toggleFavorite);
  const isFav = favorites.includes(toolId);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter') onClick(); }}
      className={cn(
        'group relative flex items-start gap-3 p-4 bg-card border border-border rounded-xl',
        'text-left transition-all duration-150 cursor-pointer',
        'hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5'
      )}
    >
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); toggleFavorite(toolId); }}
        className={cn(
          'absolute top-2.5 right-2.5 p-1 rounded-md transition-all',
          isFav
            ? 'text-warning opacity-100'
            : 'text-muted-foreground/40 opacity-0 group-hover:opacity-100 hover:text-warning'
        )}
        title={isFav ? '取消收藏' : '添加收藏'}
      >
        <Star className="size-3.5" fill={isFav ? 'currentColor' : 'none'} />
      </button>
      {icon && (
        <div className={cn('flex items-center justify-center size-10 rounded-lg shrink-0', iconColorClass || 'bg-accent text-accent-foreground')}>
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0 pr-6">
        <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
          {name}
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
          {description}
        </p>
      </div>
    </div>
  );
};

export default ToolCard;
