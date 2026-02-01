/**
 * ViewModeToggle - Alternância entre visualização Kanban e Lista
 */

import { LayoutGrid, List } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ViewMode = 'kanban' | 'list';

interface ViewModeToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export function ViewModeToggle({ viewMode, onViewModeChange }: ViewModeToggleProps) {
  return (
    <div className="flex items-center bg-[hsl(var(--avivar-muted))] rounded-lg p-1">
      <button
        onClick={() => onViewModeChange('kanban')}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200",
          viewMode === 'kanban'
            ? "bg-[hsl(var(--avivar-primary))] text-white shadow-sm"
            : "text-[hsl(var(--avivar-muted-foreground))] hover:text-[hsl(var(--avivar-foreground))]"
        )}
      >
        <LayoutGrid className="h-4 w-4" />
        <span className="hidden sm:inline">Kanban</span>
      </button>
      <button
        onClick={() => onViewModeChange('list')}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200",
          viewMode === 'list'
            ? "bg-[hsl(var(--avivar-primary))] text-white shadow-sm"
            : "text-[hsl(var(--avivar-muted-foreground))] hover:text-[hsl(var(--avivar-foreground))]"
        )}
      >
        <List className="h-4 w-4" />
        <span className="hidden sm:inline">Lista</span>
      </button>
    </div>
  );
}
