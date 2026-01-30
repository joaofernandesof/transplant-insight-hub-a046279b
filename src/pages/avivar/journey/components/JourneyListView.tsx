/**
 * List view for patient journeys
 * Alternative to Kanban view
 */

import { useMemo, useState } from 'react';
import { 
  PatientJourney, 
  JourneyType,
  COMMERCIAL_STAGES, 
  POST_SALE_STAGES,
} from '../types';
import { 
  usePatientJourneys, 
  getNextStage, 
  getStageConfig 
} from '../hooks/usePatientJourneys';
import { JourneyDetailSheet } from './JourneyDetailSheet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Plus, 
  ChevronRight, 
  Phone, 
  Mail, 
  Calendar,
  Eye,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface JourneyListViewProps {
  journeyType: JourneyType;
  searchTerm?: string;
  stageFilter?: string;
}

export function JourneyListView({ journeyType, searchTerm = '', stageFilter = 'all' }: JourneyListViewProps) {
  const [selectedJourney, setSelectedJourney] = useState<PatientJourney | null>(null);
  const { journeys, isLoading, createJourney, updateJourney } = usePatientJourneys(journeyType);

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

  const getStageInfo = (stageId: string) => {
    return stages.find(s => s.id === stageId);
  };

  return (
    <div className="space-y-4">
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

      {/* Table */}
      <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-[hsl(var(--avivar-border))] hover:bg-transparent">
                  <TableHead className="text-[hsl(var(--avivar-muted-foreground))]">Paciente</TableHead>
                  <TableHead className="text-[hsl(var(--avivar-muted-foreground))]">Contato</TableHead>
                  <TableHead className="text-[hsl(var(--avivar-muted-foreground))]">Etapa</TableHead>
                  <TableHead className="text-[hsl(var(--avivar-muted-foreground))]">Serviço</TableHead>
                  <TableHead className="text-[hsl(var(--avivar-muted-foreground))]">Data</TableHead>
                  <TableHead className="text-[hsl(var(--avivar-muted-foreground))] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredJourneys.length === 0 ? (
                  <TableRow>
                    <TableCell 
                      colSpan={6} 
                      className="h-32 text-center text-[hsl(var(--avivar-muted-foreground))]"
                    >
                      {searchTerm || stageFilter !== 'all' 
                        ? 'Nenhum resultado encontrado com os filtros aplicados'
                        : 'Nenhum paciente encontrado'
                      }
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredJourneys.map((journey) => {
                    const stageInfo = getStageInfo(journey.current_stage);
                    return (
                      <TableRow 
                        key={journey.id}
                        className="border-[hsl(var(--avivar-border))] hover:bg-[hsl(var(--avivar-muted)/0.3)] cursor-pointer"
                        onClick={() => setSelectedJourney(journey)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[hsl(var(--avivar-primary))] to-[hsl(var(--avivar-accent))] flex items-center justify-center text-white font-medium">
                              {journey.patient_name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-[hsl(var(--avivar-foreground))]">
                                {journey.patient_name}
                              </p>
                              {journey.lead_source && (
                                <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
                                  via {journey.lead_source}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {journey.patient_phone && (
                              <div className="flex items-center gap-1 text-xs text-[hsl(var(--avivar-muted-foreground))]">
                                <Phone className="h-3 w-3" />
                                {journey.patient_phone}
                              </div>
                            )}
                            {journey.patient_email && (
                              <div className="flex items-center gap-1 text-xs text-[hsl(var(--avivar-muted-foreground))]">
                                <Mail className="h-3 w-3" />
                                {journey.patient_email}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {stageInfo && (
                            <Badge 
                              className={cn(
                                "text-white border-none text-xs",
                                stageInfo.color
                              )}
                            >
                              {stageInfo.label}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-[hsl(var(--avivar-foreground))]">
                          {journey.service_type === 'capilar' ? 'Capilar' : 
                           journey.service_type === 'barba' ? 'Barba' : 
                           journey.service_type === 'sobrancelha' ? 'Sobrancelha' : journey.service_type}
                        </TableCell>
                        <TableCell className="text-[hsl(var(--avivar-muted-foreground))] text-sm">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {journey.created_at && format(new Date(journey.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-[hsl(var(--avivar-muted-foreground))] hover:text-[hsl(var(--avivar-foreground))] hover:bg-[hsl(var(--avivar-primary)/0.1)]"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedJourney(journey);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-primary)/0.1)]"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAdvance(journey);
                              }}
                            >
                              <ArrowRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Results count */}
      <div className="text-sm text-[hsl(var(--avivar-muted-foreground))]">
        {filteredJourneys.length} {filteredJourneys.length === 1 ? 'resultado' : 'resultados'} encontrado{filteredJourneys.length === 1 ? '' : 's'}
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
