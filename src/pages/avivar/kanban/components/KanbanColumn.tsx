/**
 * KanbanColumn - Componente visual da coluna do Kanban com leads
 */

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { GripVertical, MoreHorizontal, Pencil, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { LeadCard } from './LeadCard';
import type { KanbanColumnData } from '../AvivarKanbanPage';
import type { KanbanLead } from '../hooks/useKanbanLeads';

interface KanbanColumnProps {
  column: KanbanColumnData;
  leads?: KanbanLead[];
  onEdit?: () => void;
  onDelete?: () => void;
  onDeleteLead?: (leadId: string) => void;
  onLeadClick?: (lead: KanbanLead) => void;
  isDragging?: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
}

export function KanbanColumn({
  column,
  leads = [],
  onEdit,
  onDelete,
  onDeleteLead,
  onLeadClick,
  isDragging,
  dragHandleProps,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${column.id}`,
    data: {
      type: 'column',
      columnId: column.id,
    },
  });

  const leadIds = leads.map(l => l.id);

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

          {/* Lead Count Badge */}
          {leads.length > 0 && (
            <Badge variant="secondary" className="bg-white/20 text-white border-0 text-xs">
              {leads.length}
            </Badge>
          )}

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
                    className="text-destructive focus:text-destructive"
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

      <CardContent 
        ref={setNodeRef}
        className={cn(
          "p-3 min-h-[400px] bg-[hsl(var(--avivar-muted)/0.2)] transition-colors duration-200",
          isOver && "bg-[hsl(var(--avivar-primary)/0.1)] ring-2 ring-inset ring-[hsl(var(--avivar-primary)/0.3)]"
        )}
      >
        <SortableContext items={leadIds} strategy={verticalListSortingStrategy}>
          <ScrollArea className="h-[400px]">
            <div className="space-y-2 pr-2">
              {leads.length > 0 ? (
                leads.map((lead) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    onDelete={onDeleteLead}
                    onClick={onLeadClick}
                  />
                ))
              ) : (
                <div className={cn(
                  "flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-lg transition-colors",
                  isOver 
                    ? "border-[hsl(var(--avivar-primary))] bg-[hsl(var(--avivar-primary)/0.05)]" 
                    : "border-[hsl(var(--avivar-border))]"
                )}>
                  <Users className="h-6 w-6 mb-2 text-[hsl(var(--avivar-muted-foreground))] opacity-50" />
                  <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
                    {isOver ? "Solte aqui" : "Arraste leads aqui"}
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </SortableContext>
      </CardContent>
    </Card>
  );
}
