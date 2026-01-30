/**
 * Draggable wrapper for JourneyCard using @dnd-kit
 */

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PatientJourney, StageConfig } from '../types';
import { JourneyCard } from './JourneyCard';
import { cn } from '@/lib/utils';

interface DraggableJourneyCardProps {
  journey: PatientJourney;
  stageConfig: StageConfig;
  onUpdate: (updates: Partial<PatientJourney>) => void;
  onAdvance: () => void;
  onSelect: () => void;
}

export function DraggableJourneyCard({
  journey,
  stageConfig,
  onUpdate,
  onAdvance,
  onSelect
}: DraggableJourneyCardProps) {
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
      <JourneyCard
        journey={journey}
        stageConfig={stageConfig}
        onUpdate={onUpdate}
        onAdvance={onAdvance}
        onSelect={onSelect}
      />
    </div>
  );
}
