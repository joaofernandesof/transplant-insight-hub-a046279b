import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SectorTicketStage } from '@/neohub/hooks/useSectorTickets';

interface Props {
  stages: SectorTicketStage[];
  currentStageId: string | null;
}

export function SectorTicketStageFlow({ stages, currentStageId }: Props) {
  const sorted = [...stages].sort((a, b) => a.order_index - b.order_index);
  const currentIdx = sorted.findIndex(s => s.id === currentStageId);

  return (
    <div className="flex items-center justify-between w-full overflow-x-auto py-4">
      {sorted.map((stage, idx) => {
        const isPast = idx < currentIdx;
        const isCurrent = idx === currentIdx;
        const isFuture = idx > currentIdx;

        return (
          <div key={stage.id} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center gap-1 min-w-[80px]">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                isPast && "bg-primary border-primary text-primary-foreground",
                isCurrent && "border-primary bg-primary/10 text-primary ring-4 ring-primary/20",
                isFuture && "border-muted-foreground/30 text-muted-foreground"
              )}>
                {isPast ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <span className="text-sm font-medium">{idx + 1}</span>
                )}
              </div>
              <span className={cn(
                "text-xs text-center max-w-[90px] truncate",
                isCurrent ? "font-semibold text-primary" : "text-muted-foreground"
              )}>
                {stage.name}
              </span>
              {stage.sla_hours && (
                <span className="text-[10px] text-muted-foreground">
                  SLA: {stage.sla_hours}h
                </span>
              )}
            </div>
            {idx < sorted.length - 1 && (
              <div className={cn(
                "flex-1 h-0.5 mx-1",
                idx < currentIdx ? "bg-primary" : "bg-muted-foreground/20"
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}
