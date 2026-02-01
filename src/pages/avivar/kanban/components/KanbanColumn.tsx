/**
 * KanbanColumn - Componente visual da coluna do Kanban
 */

import { GripVertical, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { KanbanColumnData } from '../AvivarKanbanPage';

interface KanbanColumnProps {
  column: KanbanColumnData;
  onEdit?: () => void;
  onDelete?: () => void;
  isDragging?: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
}

export function KanbanColumn({
  column,
  onEdit,
  onDelete,
  isDragging,
  dragHandleProps,
}: KanbanColumnProps) {
  return (
    <Card
      className={cn(
        "w-[280px] flex-shrink-0 border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-card))]",
        isDragging && "shadow-xl ring-2 ring-[hsl(var(--avivar-primary))]"
      )}
    >
      <CardHeader className="p-0">
        <div className={cn(
          "px-4 py-3 rounded-t-lg bg-gradient-to-r text-white flex items-center gap-2",
          column.color
        )}>
          {/* Drag Handle */}
          {dragHandleProps && (
            <div
              {...dragHandleProps}
              className="cursor-grab active:cursor-grabbing p-1 hover:bg-white/20 rounded"
            >
              <GripVertical className="h-4 w-4" />
            </div>
          )}

          <h3 className="font-semibold text-sm flex-1 truncate">
            {column.name}
          </h3>

          {/* Actions Menu */}
          {(onEdit || onDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 hover:bg-white/20 text-white"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[hsl(var(--avivar-card))]">
                {onEdit && (
                  <DropdownMenuItem onClick={onEdit}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem 
                    onClick={onDelete}
                    className="text-red-500 focus:text-red-500"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-3 min-h-[400px] bg-[hsl(var(--avivar-muted)/0.2)]">
        <ScrollArea className="h-[400px]">
          <div className="space-y-2 pr-2">
            {/* Cards dos leads virão aqui no futuro */}
            <div className="flex items-center justify-center h-32 border-2 border-dashed border-[hsl(var(--avivar-border))] rounded-lg">
              <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
                Arraste leads aqui
              </p>
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
