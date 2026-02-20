/**
 * KanbanColumn - Componente visual da coluna do Kanban com leads
 * Scroll interno (não página inteira) para telas menores
 */

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { GripVertical, MoreHorizontal, Pencil, Plus, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  onAddColumnAfter?: () => void;
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
  onAddColumnAfter,
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
        "w-[260px] sm:w-[280px] flex-shrink-0 border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-card))] flex flex-col h-full max-h-[calc(100vh-200px)] transition-all duration-200",
        isDragging && "shadow-xl ring-2 ring-[hsl(var(--avivar-primary))]",
        isOver && "ring-2 ring-[hsl(var(--avivar-primary))] shadow-lg shadow-[hsl(var(--avivar-primary)/0.3)]"
      )}
    >
      <CardHeader className="p-0 flex-shrink-0">
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

          {/* Add Column After Button */}
          {onAddColumnAfter && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onAddColumnAfter}
              className="h-7 w-7 hover:bg-white/20 text-white"
              title="Adicionar coluna à direita"
            >
              <Plus className="h-4 w-4" />
            </Button>
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
          "p-3 flex-1 overflow-hidden transition-all duration-200",
          isOver 
            ? "bg-[hsl(var(--avivar-primary)/0.15)]" 
            : "bg-[hsl(var(--avivar-muted)/0.2)]"
        )}
      >
        <SortableContext items={leadIds} strategy={verticalListSortingStrategy}>
          {/* Custom scroll area for internal column scrolling */}
          <div 
            className="h-full overflow-y-auto pr-1 space-y-2"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(139, 92, 246, 0.3) transparent',
            }}
          >
            <style>{`
              .kanban-column-scroll::-webkit-scrollbar {
                width: 4px;
              }
              .kanban-column-scroll::-webkit-scrollbar-track {
                background: transparent;
              }
              .kanban-column-scroll::-webkit-scrollbar-thumb {
                background: rgba(139, 92, 246, 0.3);
                border-radius: 4px;
              }
              .kanban-column-scroll::-webkit-scrollbar-thumb:hover {
                background: rgba(139, 92, 246, 0.5);
              }
            `}</style>
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
                "flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-lg transition-all duration-200",
                isOver 
                  ? "border-[hsl(var(--avivar-primary))] bg-[hsl(var(--avivar-primary)/0.1)] scale-[1.02]" 
                  : "border-[hsl(var(--avivar-border))]"
              )}>
                <Users className={cn(
                  "h-6 w-6 mb-2 transition-colors",
                  isOver ? "text-[hsl(var(--avivar-primary))]" : "text-[hsl(var(--avivar-muted-foreground))] opacity-50"
                )} />
                <p className={cn(
                  "text-xs font-medium transition-colors",
                  isOver ? "text-[hsl(var(--avivar-primary))]" : "text-[hsl(var(--avivar-muted-foreground))]"
                )}>
                  {isOver ? "Solte aqui!" : "Arraste leads aqui"}
                </p>
              </div>
            )}
          </div>
        </SortableContext>
      </CardContent>
    </Card>
  );
}
