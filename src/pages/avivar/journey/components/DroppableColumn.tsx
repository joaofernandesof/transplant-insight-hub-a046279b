/**
 * Droppable column wrapper for Kanban columns using @dnd-kit
 * Updated with compact card design
 */

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PatientJourney, StageConfig } from '../types';
import { CompactJourneyCard } from './CompactJourneyCard';

interface DroppableColumnProps {
  column: StageConfig & { items: PatientJourney[] };
  onSelect: (journey: PatientJourney) => void;
  isOver?: boolean;
}

// Draggable wrapper for compact card
function DraggableCompactCard({ 
  journey, 
  onSelect 
}: { 
  journey: PatientJourney; 
  onSelect: () => void; 
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ 
    id: journey.id,
    data: {
      type: 'journey',
      journey
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "touch-none",
        isDragging && "opacity-50 z-50"
      )}
      {...attributes}
      {...listeners}
    >
      <CompactJourneyCard
        journey={journey}
        onSelect={onSelect}
      />
    </div>
  );
}

export function DroppableColumn({
  column,
  onSelect,
  isOver
}: DroppableColumnProps) {
  const { setNodeRef } = useDroppable({
    id: column.id,
    data: {
      type: 'column',
      stage: column.id
    }
  });

  const itemIds = column.items.map(item => item.id);

  return (
    <div className="flex-shrink-0 w-[240px] lg:w-[280px]">
      <Card className={cn(
        "border-[hsl(var(--avivar-border))] shadow-sm overflow-hidden transition-all duration-200",
        isOver && "ring-2 ring-[hsl(var(--avivar-primary))] ring-offset-2"
      )}>
        {/* Column Header */}
        <div className={cn(
          "px-4 py-3 rounded-t-xl bg-gradient-to-r text-white text-center",
          column.color
        )}>
          <h3 className="font-semibold text-sm">{column.label}</h3>
          <p className="text-xs opacity-90">{column.description}</p>
        </div>

        {/* Column Content */}
        <CardContent 
          ref={setNodeRef}
          className={cn(
            "p-3 bg-[hsl(var(--avivar-muted)/0.2)] min-h-[400px] transition-colors duration-200",
            isOver && "bg-[hsl(var(--avivar-primary)/0.1)]"
          )}
        >
          <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
            {column.items.length === 0 ? (
              <div className={cn(
                "flex flex-col items-center justify-center h-[300px] text-[hsl(var(--avivar-muted-foreground))] text-sm border-2 border-dashed rounded-lg transition-colors",
                isOver ? "border-[hsl(var(--avivar-primary))] bg-[hsl(var(--avivar-primary)/0.05)]" : "border-transparent"
              )}>
                <Users className="h-8 w-8 mb-2 opacity-50" />
                <span>{isOver ? "Solte aqui" : "Nenhum paciente"}</span>
              </div>
            ) : (
              <ScrollArea className="h-[450px]">
                <div className="space-y-2 pr-2">
                  {column.items.map(journey => (
                    <DraggableCompactCard
                      key={journey.id}
                      journey={journey}
                      onSelect={() => onSelect(journey)}
                    />
                  ))}
                </div>
              </ScrollArea>
            )}
          </SortableContext>
        </CardContent>
      </Card>
    </div>
  );
}
