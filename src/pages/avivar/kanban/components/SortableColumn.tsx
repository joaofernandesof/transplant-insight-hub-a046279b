/**
 * SortableColumn - Coluna arrastável do Kanban com leads
 */

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { KanbanColumn } from './KanbanColumn';
import type { KanbanColumnData } from '../AvivarKanbanPage';
import type { KanbanLead } from '../hooks/useKanbanLeads';

interface SortableColumnProps {
  column: KanbanColumnData;
  leads?: KanbanLead[];
  onEdit: () => void;
  onDelete: () => void;
  onDeleteLead?: (leadId: string) => void;
  onLeadClick?: (lead: KanbanLead) => void;
  onAddColumnAfter?: () => void;
}

export function SortableColumn({ 
  column, 
  leads = [],
  onEdit, 
  onDelete,
  onDeleteLead,
  onLeadClick,
  onAddColumnAfter,
}: SortableColumnProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <KanbanColumn
        column={column}
        leads={leads}
        onEdit={onEdit}
        onDelete={onDelete}
        onDeleteLead={onDeleteLead}
        onLeadClick={onLeadClick}
        onAddColumnAfter={onAddColumnAfter}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}
