/**
 * Kanban board for patient journeys
 * With horizontal scroll, filters support
 */

import { useMemo, useState, useRef, useEffect } from 'react';
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
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Users, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface JourneyKanbanProps {
  journeyType: JourneyType;
  searchTerm?: string;
  stageFilter?: string;
}

export function JourneyKanban({ journeyType, searchTerm = '', stageFilter = 'all' }: JourneyKanbanProps) {
  const [selectedJourney, setSelectedJourney] = useState<PatientJourney | null>(null);
  const { journeys, isLoading, createJourney, updateJourney } = usePatientJourneys(journeyType);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const stages = journeyType === 'comercial' ? COMMERCIAL_STAGES : POST_SALE_STAGES;

  // Filter journeys
  const filteredJourneys = useMemo(() => {
    return journeys.filter(j => {
      const matchesSearch = !searchTerm || 
        j.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        j.patient_phone?.includes(searchTerm) ||
        j.patient_email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStage = stageFilter === 'all' || j.current_stage === stageFilter;
      
      return matchesSearch && matchesStage;
    });
  }, [journeys, searchTerm, stageFilter]);

  const columns = useMemo(() => {
    // If filtering by stage, only show that column
    const visibleStages = stageFilter !== 'all' 
      ? stages.filter(s => s.id === stageFilter)
      : stages;

    return visibleStages.map(stage => ({
      ...stage,
      items: filteredJourneys.filter(j => j.current_stage === stage.id)
    }));
  }, [filteredJourneys, stages, stageFilter]);

  // Check scroll state
  const checkScrollState = () => {
    const container = scrollContainerRef.current;
    if (container) {
      setCanScrollLeft(container.scrollLeft > 0);
      setCanScrollRight(container.scrollLeft < container.scrollWidth - container.clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScrollState();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollState);
      window.addEventListener('resize', checkScrollState);
      return () => {
        container.removeEventListener('scroll', checkScrollState);
        window.removeEventListener('resize', checkScrollState);
      };
    }
  }, [columns]);

  const scrollTo = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (container) {
      const scrollAmount = 280;
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

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

  return (
    <div className="space-y-4">
      {/* Summary Row */}
      <div className="flex flex-wrap gap-3 p-4 bg-[hsl(var(--avivar-muted)/0.3)] rounded-xl overflow-x-auto">
        {(stageFilter === 'all' ? stages : stages.filter(s => s.id === stageFilter)).map(stage => {
          const count = journeys.filter(j => j.current_stage === stage.id).length;
          return (
            <div 
              key={stage.id}
              className="flex-1 min-w-[100px] bg-[hsl(var(--avivar-card))] rounded-lg p-3 text-center shadow-sm border border-[hsl(var(--avivar-border))]"
            >
              <div className="flex items-center justify-center gap-2 mb-1">
                <div className={cn("w-2 h-2 rounded-full", stage.statusColor)} />
                <span className="text-xs font-medium text-[hsl(var(--avivar-muted-foreground))]">{stage.label}</span>
              </div>
              <span className="text-2xl font-bold text-[hsl(var(--avivar-foreground))]">{count}</span>
            </div>
          );
        })}
      </div>

      {/* Add Lead Button (only for commercial) */}
      {journeyType === 'comercial' && (
        <div className="flex justify-end">
          <Button 
            onClick={handleCreateLead} 
            size="sm"
            className="bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-accent))] text-white"
          >
            <Plus className="h-4 w-4 mr-1" />
            Novo Lead
          </Button>
        </div>
      )}

      {/* Kanban Container with Scroll Controls */}
      <div className="relative group">
        {/* Left Scroll Button */}
        {canScrollLeft && (
          <Button
            variant="secondary"
            size="icon"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full shadow-lg bg-[hsl(var(--avivar-card))] border border-[hsl(var(--avivar-border))] opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => scrollTo('left')}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}

        {/* Right Scroll Button */}
        {canScrollRight && (
          <Button
            variant="secondary"
            size="icon"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full shadow-lg bg-[hsl(var(--avivar-card))] border border-[hsl(var(--avivar-border))] opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => scrollTo('right')}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        )}

        {/* Kanban Columns - Scrollable */}
        <div 
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto pb-4 scroll-smooth scrollbar-thin scrollbar-thumb-[hsl(var(--avivar-border))] scrollbar-track-transparent"
          style={{ 
            scrollbarWidth: 'thin',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {columns.map(column => (
            <div 
              key={column.id}
              className="flex-shrink-0 w-[240px] lg:w-[260px]"
            >
              <Card className="border-[hsl(var(--avivar-border))] shadow-sm overflow-hidden">
                {/* Column Header */}
                <div className={cn(
                  "px-4 py-3 rounded-t-xl bg-gradient-to-r text-white text-center",
                  column.color
                )}>
                  <h3 className="font-semibold text-sm">{column.label}</h3>
                  <p className="text-xs opacity-90">{column.description}</p>
                </div>

                {/* Column Content */}
                <CardContent className="p-3 bg-[hsl(var(--avivar-muted)/0.2)] min-h-[400px]">
                  {column.items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[300px] text-[hsl(var(--avivar-muted-foreground))] text-sm">
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
