/**
 * Kanban board for patient journeys
 */

import { useMemo, useState } from 'react';
import { 
  PatientJourney, 
  JourneyType, 
  JourneyStage,
  COMMERCIAL_STAGES, 
  POST_SALE_STAGES,
  StageConfig
} from '../types';
import { 
  usePatientJourneys, 
  getNextStage, 
  getStageConfig 
} from '../hooks/usePatientJourneys';
import { JourneyCard } from './JourneyCard';
import { JourneyDetailSheet } from './JourneyDetailSheet';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Users, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface JourneyKanbanProps {
  journeyType: JourneyType;
}

export function JourneyKanban({ journeyType }: JourneyKanbanProps) {
  const [selectedJourney, setSelectedJourney] = useState<PatientJourney | null>(null);
  const { journeys, isLoading, createJourney, updateJourney } = usePatientJourneys(journeyType);

  const stages = journeyType === 'comercial' ? COMMERCIAL_STAGES : POST_SALE_STAGES;

  const columns = useMemo(() => {
    return stages.map(stage => ({
      ...stage,
      items: journeys.filter(j => j.current_stage === stage.id)
    }));
  }, [journeys, stages]);

  const handleCreateLead = () => {
    createJourney.mutate({
      patient_name: 'Novo Lead',
      service_type: 'capilar'
    });
  };

  const handleUpdate = (journeyId: string, updates: Partial<PatientJourney>) => {
    updateJourney.mutate({ id: journeyId, updates });
  };

  const handleAdvance = (journey: PatientJourney) => {
    const nextStage = getNextStage(journey.current_stage, journey.journey_type);
    
    if (!nextStage) {
      toast.info('Esta é a última etapa do fluxo');
      return;
    }

    // If transitioning from commercial to post-sale
    if (journey.journey_type === 'comercial' && nextStage === 'onboarding') {
      updateJourney.mutate({
        id: journey.id,
        updates: {
          current_stage: nextStage,
          journey_type: 'pos_venda',
          converted_at: new Date().toISOString()
        }
      }, {
        onSuccess: () => {
          toast.success('Paciente transferido para Pós-Venda!');
        }
      });
    } else {
      updateJourney.mutate({
        id: journey.id,
        updates: { current_stage: nextStage }
      }, {
        onSuccess: () => {
          toast.success(`Avançado para ${getStageConfig(nextStage)?.label}`);
        }
      });
    }
  };

  // Summary stats
  const totalInStage = columns.reduce((acc, col) => {
    acc[col.id] = col.items.length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-4">
      {/* Summary Row */}
      <div className="flex flex-wrap gap-3 p-4 bg-muted/30 rounded-xl">
        {columns.map(col => (
          <div 
            key={col.id}
            className="flex-1 min-w-[100px] bg-background rounded-lg p-3 text-center shadow-sm"
          >
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className={cn("w-2 h-2 rounded-full", col.statusColor)} />
              <span className="text-xs font-medium text-muted-foreground">{col.label}</span>
            </div>
            <span className="text-2xl font-bold">{col.items.length}</span>
          </div>
        ))}
      </div>

      {/* Add Lead Button (only for commercial) */}
      {journeyType === 'comercial' && (
        <div className="flex justify-end">
          <Button onClick={handleCreateLead} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Novo Lead
          </Button>
        </div>
      )}

      {/* Kanban Columns */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map(column => (
          <div 
            key={column.id}
            className="flex-shrink-0 w-[240px] lg:w-[260px]"
          >
            <Card className="border-none shadow-sm overflow-hidden">
              {/* Column Header */}
              <div className={cn(
                "px-4 py-3 rounded-t-xl bg-gradient-to-r text-white text-center",
                column.color
              )}>
                <h3 className="font-semibold text-sm">{column.label}</h3>
                <p className="text-xs opacity-90">{column.description}</p>
              </div>

              {/* Column Content */}
              <CardContent className="p-3 bg-muted/20 min-h-[400px]">
                {column.items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground text-sm">
                    <Users className="h-8 w-8 mb-2 opacity-50" />
                    <span>Nenhum paciente</span>
                  </div>
                ) : (
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-2 pr-2">
                      {column.items.map(journey => (
                        <JourneyCard
                          key={journey.id}
                          journey={journey}
                          stageConfig={column}
                          onUpdate={(updates) => handleUpdate(journey.id, updates)}
                          onAdvance={() => handleAdvance(journey)}
                          onSelect={() => setSelectedJourney(journey)}
                        />
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      {/* Detail Sheet */}
      <JourneyDetailSheet
        journey={selectedJourney}
        open={!!selectedJourney}
        onClose={() => setSelectedJourney(null)}
        onUpdate={(updates) => {
          if (selectedJourney) {
            handleUpdate(selectedJourney.id, updates);
          }
        }}
        onAdvance={() => {
          if (selectedJourney) {
            handleAdvance(selectedJourney);
            setSelectedJourney(null);
          }
        }}
      />
    </div>
  );
}
