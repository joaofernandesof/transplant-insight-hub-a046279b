/**
 * IPROMED - Journey Deliverables List Component
 * Lista interativa de entregáveis da jornada com progresso
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  CheckCircle2,
  Circle,
  Clock,
  ChevronDown,
  ChevronRight,
  Loader2,
  MessageSquare,
  Calendar,
} from "lucide-react";
import { format, differenceInDays, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext";

interface Deliverable {
  id: string;
  code: string;
  phase: string;
  title: string;
  description: string | null;
  order_index: number;
  is_required: boolean;
}

interface ClientDeliverable {
  id: string;
  deliverable_id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  completed_at: string | null;
  notes: string | null;
  due_date: string | null;
}

interface JourneyDeliverablesListProps {
  clientId: string;
  clientName: string;
  startDate: string;
  onProgressChange?: (progress: number) => void;
}

const phaseColors: Record<string, string> = {
  'D0': 'bg-blue-500',
  'D+1': 'bg-indigo-500',
  'D+3': 'bg-purple-500',
  'D+7': 'bg-teal-500',
  'D+15': 'bg-amber-500',
  'D+30': 'bg-rose-500',
  'Contínuo': 'bg-emerald-500',
};

const phaseDays: Record<string, number> = {
  'D0': 0,
  'D+1': 1,
  'D+3': 3,
  'D+7': 7,
  'D+15': 15,
  'D+30': 30,
  'Contínuo': 90,
};

export default function JourneyDeliverablesList({
  clientId,
  clientName,
  startDate,
  onProgressChange,
}: JourneyDeliverablesListProps) {
  const [expandedPhases, setExpandedPhases] = useState<string[]>(['D0', 'D+1']);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  
  const { user } = useUnifiedAuth();
  const queryClient = useQueryClient();

  // Fetch all deliverables
  const { data: deliverables = [] } = useQuery({
    queryKey: ['ipromed-journey-deliverables'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ipromed_journey_deliverables')
        .select('*')
        .order('order_index');
      
      if (error) throw error;
      return data as Deliverable[];
    },
  });

  // Fetch client's journey progress
  const { data: clientProgress = [], isLoading } = useQuery({
    queryKey: ['ipromed-client-journey', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ipromed_client_journey')
        .select('*')
        .eq('client_id', clientId);
      
      if (error) throw error;
      return data as ClientDeliverable[];
    },
    enabled: !!clientId,
  });

  // Update deliverable status
  const updateStatus = useMutation({
    mutationFn: async ({ 
      deliverableId, 
      status, 
      notes 
    }: { 
      deliverableId: string; 
      status: string; 
      notes?: string;
    }) => {
      const existingProgress = clientProgress.find(p => p.deliverable_id === deliverableId);
      
      if (existingProgress) {
        const { error } = await supabase
          .from('ipromed_client_journey')
          .update({
            status,
            completed_at: status === 'completed' ? new Date().toISOString() : null,
            completed_by: status === 'completed' ? user?.id : null,
            notes: notes || existingProgress.notes,
          })
          .eq('id', existingProgress.id);
        
        if (error) throw error;
      } else {
        const deliverable = deliverables.find(d => d.id === deliverableId);
        const dueDate = addDays(new Date(startDate), phaseDays[deliverable?.phase || 'D0'] || 0);
        
        const { error } = await supabase
          .from('ipromed_client_journey')
          .insert({
            client_id: clientId,
            deliverable_id: deliverableId,
            status,
            completed_at: status === 'completed' ? new Date().toISOString() : null,
            completed_by: status === 'completed' ? user?.id : null,
            due_date: dueDate.toISOString().split('T')[0],
            notes,
          });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ipromed-client-journey', clientId] });
      toast.success('Progresso atualizado');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar: ' + error.message);
    },
  });

  // Group deliverables by phase
  const deliverablesByPhase = deliverables.reduce((acc, del) => {
    if (!acc[del.phase]) acc[del.phase] = [];
    acc[del.phase].push(del);
    return acc;
  }, {} as Record<string, Deliverable[]>);

  // Calculate progress
  const totalRequired = deliverables.filter(d => d.is_required).length;
  const completedRequired = clientProgress.filter(p => {
    const del = deliverables.find(d => d.id === p.deliverable_id);
    return del?.is_required && p.status === 'completed';
  }).length;
  const progress = totalRequired > 0 ? Math.round((completedRequired / totalRequired) * 100) : 0;

  // Get status for a deliverable
  const getDeliverableStatus = (deliverableId: string) => {
    const p = clientProgress.find(cp => cp.deliverable_id === deliverableId);
    return p?.status || 'pending';
  };

  // Check if phase is overdue
  const isPhaseOverdue = (phase: string) => {
    const phaseDayOffset = phaseDays[phase] || 0;
    const phaseDeadline = addDays(new Date(startDate), phaseDayOffset);
    return new Date() > phaseDeadline;
  };

  // Toggle phase expansion
  const togglePhase = (phase: string) => {
    setExpandedPhases(prev => 
      prev.includes(phase) 
        ? prev.filter(p => p !== phase)
        : [...prev, phase]
    );
  };

  // Handle checkbox change
  const handleCheckboxChange = (deliverableId: string, checked: boolean) => {
    updateStatus.mutate({
      deliverableId,
      status: checked ? 'completed' : 'pending',
    });
  };

  // Handle note save
  const handleNoteSave = (deliverableId: string) => {
    updateStatus.mutate({
      deliverableId,
      status: getDeliverableStatus(deliverableId),
      notes: noteText,
    });
    setEditingNote(null);
    setNoteText("");
  };

  // Get phases in order
  const orderedPhases = ['D0', 'D+1', 'D+3', 'D+7', 'D+15', 'D+30', 'Contínuo'];

  if (isLoading) {
    return (
      <Card className="border-none shadow-md">
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Jornada do Cliente</CardTitle>
          <Badge variant="outline">{clientName}</Badge>
        </div>
        <div className="space-y-1 mt-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progresso Geral</span>
            <span className="font-semibold">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-3">
            {orderedPhases.map((phase) => {
              const phaseDeliverables = deliverablesByPhase[phase] || [];
              if (phaseDeliverables.length === 0) return null;
              
              const phaseCompleted = phaseDeliverables.filter(d => 
                getDeliverableStatus(d.id) === 'completed'
              ).length;
              const phaseTotal = phaseDeliverables.length;
              const isExpanded = expandedPhases.includes(phase);
              const overdue = isPhaseOverdue(phase) && phaseCompleted < phaseTotal;

              return (
                <Collapsible
                  key={phase}
                  open={isExpanded}
                  onOpenChange={() => togglePhase(phase)}
                >
                  <CollapsibleTrigger asChild>
                    <div className={cn(
                      "flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors",
                      isExpanded ? "bg-muted" : "hover:bg-muted/50",
                      overdue && "ring-2 ring-rose-200 dark:ring-rose-900"
                    )}>
                      <div className="flex items-center gap-3">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                        <div className={cn(
                          "w-3 h-3 rounded-full",
                          phaseColors[phase] || 'bg-gray-500'
                        )} />
                        <span className="font-medium">{phase}</span>
                        {overdue && (
                          <Badge variant="outline" className="text-rose-600 border-rose-300 text-[10px]">
                            Atrasado
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {phaseCompleted}/{phaseTotal}
                        </span>
                        {phaseCompleted === phaseTotal && (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        )}
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <div className="ml-6 mt-2 space-y-2 border-l-2 border-muted pl-4">
                      {phaseDeliverables.map((deliverable) => {
                        const status = getDeliverableStatus(deliverable.id);
                        const isCompleted = status === 'completed';
                        const progress = clientProgress.find(
                          p => p.deliverable_id === deliverable.id
                        );

                        return (
                          <div
                            key={deliverable.id}
                            className={cn(
                              "p-3 rounded-lg border transition-colors",
                              isCompleted 
                                ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200" 
                                : "bg-background border-border hover:border-primary/50"
                            )}
                          >
                            <div className="flex items-start gap-3">
                              <Checkbox
                                checked={isCompleted}
                                onCheckedChange={(checked) => 
                                  handleCheckboxChange(deliverable.id, !!checked)
                                }
                                disabled={updateStatus.isPending}
                                className="mt-0.5"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <p className={cn(
                                    "font-medium text-sm",
                                    isCompleted && "line-through text-muted-foreground"
                                  )}>
                                    {deliverable.title}
                                  </p>
                                  {!deliverable.is_required && (
                                    <Badge variant="outline" className="text-[10px]">
                                      Opcional
                                    </Badge>
                                  )}
                                </div>
                                {deliverable.description && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {deliverable.description}
                                  </p>
                                )}
                                
                                {/* Notes section */}
                                {editingNote === deliverable.id ? (
                                  <div className="mt-2 space-y-2">
                                    <Textarea
                                      value={noteText}
                                      onChange={(e) => setNoteText(e.target.value)}
                                      placeholder="Adicionar observação..."
                                      className="text-xs min-h-[60px]"
                                    />
                                    <div className="flex gap-2">
                                      <Button 
                                        size="sm" 
                                        className="h-7 text-xs"
                                        onClick={() => handleNoteSave(deliverable.id)}
                                      >
                                        Salvar
                                      </Button>
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        className="h-7 text-xs"
                                        onClick={() => {
                                          setEditingNote(null);
                                          setNoteText("");
                                        }}
                                      >
                                        Cancelar
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 mt-2">
                                    {progress?.notes ? (
                                      <p className="text-xs text-muted-foreground italic">
                                        📝 {progress.notes}
                                      </p>
                                    ) : (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 text-xs text-muted-foreground"
                                        onClick={() => {
                                          setEditingNote(deliverable.id);
                                          setNoteText(progress?.notes || "");
                                        }}
                                      >
                                        <MessageSquare className="h-3 w-3 mr-1" />
                                        Adicionar nota
                                      </Button>
                                    )}
                                    {isCompleted && progress?.completed_at && (
                                      <span className="text-[10px] text-muted-foreground">
                                        <Calendar className="h-3 w-3 inline mr-1" />
                                        {format(new Date(progress.completed_at), "dd/MM", { locale: ptBR })}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
