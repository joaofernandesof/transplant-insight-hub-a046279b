/**
 * IPROMED - Timeline de Andamentos Processuais
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  FileText,
  Plus,
  Clock,
  Gavel,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Loader2,
  MessageSquare,
  Scale,
  Bell,
} from "lucide-react";
import { format, formatDistanceToNow, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface CaseMovement {
  id: string;
  case_id: string;
  movement_date: string;
  title: string;
  description: string | null;
  movement_type: string;
  source: string;
  has_deadline: boolean;
  deadline_date: string | null;
  deadline_completed: boolean;
  created_at: string;
}

interface CaseMovementsTimelineProps {
  caseId?: string;
  showCaseSelector?: boolean;
}

const movementTypeConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  andamento: { label: 'Andamento', icon: FileText, color: 'bg-blue-500' },
  decisao: { label: 'Decisão', icon: Gavel, color: 'bg-purple-500' },
  sentenca: { label: 'Sentença', icon: Scale, color: 'bg-rose-500' },
  despacho: { label: 'Despacho', icon: MessageSquare, color: 'bg-amber-500' },
  intimacao: { label: 'Intimação', icon: Bell, color: 'bg-orange-500' },
  publicacao: { label: 'Publicação', icon: FileText, color: 'bg-cyan-500' },
};

export default function CaseMovementsTimeline({ caseId, showCaseSelector = false }: CaseMovementsTimelineProps) {
  const [selectedCaseId, setSelectedCaseId] = useState(caseId || '');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newMovement, setNewMovement] = useState({
    title: '',
    description: '',
    movement_type: 'andamento',
    movement_date: new Date().toISOString().split('T')[0],
    has_deadline: false,
    deadline_date: '',
  });

  const queryClient = useQueryClient();
  const effectiveCaseId = caseId || selectedCaseId;

  // Fetch cases for dropdown
  const { data: cases = [] } = useQuery({
    queryKey: ['ipromed-cases-dropdown'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ipromed_legal_cases')
        .select('id, title, case_number')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: showCaseSelector,
  });

  // Fetch movements
  const { data: movements = [], isLoading } = useQuery({
    queryKey: ['ipromed-case-movements', effectiveCaseId],
    queryFn: async () => {
      if (!effectiveCaseId) return [];
      
      const { data, error } = await supabase
        .from('ipromed_case_movements')
        .select('*')
        .eq('case_id', effectiveCaseId)
        .order('movement_date', { ascending: false });
      
      if (error) throw error;
      return data as CaseMovement[];
    },
    enabled: !!effectiveCaseId,
  });

  // Add movement mutation
  const addMovement = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('ipromed_case_movements')
        .insert([{
          case_id: effectiveCaseId,
          title: newMovement.title,
          description: newMovement.description || null,
          movement_type: newMovement.movement_type,
          movement_date: newMovement.movement_date,
          has_deadline: newMovement.has_deadline,
          deadline_date: newMovement.has_deadline ? newMovement.deadline_date : null,
        }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ipromed-case-movements'] });
      toast.success('Andamento registrado!');
      setIsAddOpen(false);
      setNewMovement({
        title: '',
        description: '',
        movement_type: 'andamento',
        movement_date: new Date().toISOString().split('T')[0],
        has_deadline: false,
        deadline_date: '',
      });
    },
    onError: (error) => {
      toast.error('Erro ao registrar: ' + error.message);
    },
  });

  // Toggle deadline completion
  const toggleDeadline = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const { error } = await supabase
        .from('ipromed_case_movements')
        .update({ deadline_completed: completed })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ipromed-case-movements'] });
    },
  });

  const pendingDeadlines = movements.filter(m => m.has_deadline && !m.deadline_completed);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-[#0066CC]" />
            Andamentos Processuais
          </h2>
          <p className="text-sm text-muted-foreground">
            Timeline de movimentações do processo
          </p>
        </div>
        
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-[#0066CC]" disabled={!effectiveCaseId}>
              <Plus className="h-4 w-4" />
              Novo Andamento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Andamento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={newMovement.movement_type}
                    onValueChange={(v) => setNewMovement(prev => ({ ...prev, movement_type: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(movementTypeConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>{config.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Data</Label>
                  <Input
                    type="date"
                    value={newMovement.movement_date}
                    onChange={(e) => setNewMovement(prev => ({ ...prev, movement_date: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Título *</Label>
                <Input
                  value={newMovement.title}
                  onChange={(e) => setNewMovement(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Resumo do andamento"
                />
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={newMovement.description}
                  onChange={(e) => setNewMovement(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Detalhes..."
                  rows={3}
                />
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  checked={newMovement.has_deadline}
                  onCheckedChange={(v) => setNewMovement(prev => ({ ...prev, has_deadline: !!v }))}
                />
                <Label>Gera prazo</Label>
              </div>

              {newMovement.has_deadline && (
                <div className="space-y-2">
                  <Label>Data do Prazo</Label>
                  <Input
                    type="date"
                    value={newMovement.deadline_date}
                    onChange={(e) => setNewMovement(prev => ({ ...prev, deadline_date: e.target.value }))}
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={() => addMovement.mutate()}
                  disabled={!newMovement.title || addMovement.isPending}
                  className="bg-[#0066CC]"
                >
                  {addMovement.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Salvar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Case Selector */}
      {showCaseSelector && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Label className="whitespace-nowrap">Processo:</Label>
              <Select value={selectedCaseId} onValueChange={setSelectedCaseId}>
                <SelectTrigger className="max-w-md">
                  <SelectValue placeholder="Selecione um processo" />
                </SelectTrigger>
                <SelectContent>
                  {cases.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.case_number || c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Deadlines Alert */}
      {pendingDeadlines.length > 0 && (
        <Card className="border-0 shadow-sm bg-amber-50 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <div>
                <p className="font-medium text-amber-800">
                  {pendingDeadlines.length} prazo(s) pendente(s)
                </p>
                <p className="text-sm text-amber-600">
                  Verifique os prazos abaixo na timeline
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          {!effectiveCaseId ? (
            <div className="text-center py-8 text-muted-foreground">
              <Gavel className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>Selecione um processo para ver os andamentos</p>
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : movements.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="font-medium">Nenhum andamento registrado</p>
              <p className="text-sm">Clique em "Novo Andamento" para começar</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px] pr-4">
              <div className="relative pl-8">
                {/* Timeline line */}
                <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200" />

                <div className="space-y-6">
                  {movements.map((movement, index) => {
                    const config = movementTypeConfig[movement.movement_type] || movementTypeConfig.andamento;
                    const Icon = config.icon;
                    const isOverdue = movement.has_deadline && 
                      movement.deadline_date && 
                      !movement.deadline_completed && 
                      isPast(new Date(movement.deadline_date));

                    return (
                      <div key={movement.id} className="relative">
                        {/* Timeline dot */}
                        <div className={`absolute -left-5 w-6 h-6 rounded-full ${config.color} flex items-center justify-center`}>
                          <Icon className="h-3 w-3 text-white" />
                        </div>

                        <div className={`bg-white border rounded-lg p-4 ${isOverdue ? 'border-rose-300 bg-rose-50' : ''}`}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-xs">
                                  {config.label}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(movement.movement_date), "dd/MM/yyyy", { locale: ptBR })}
                                </span>
                              </div>
                              <h4 className="font-medium">{movement.title}</h4>
                              {movement.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {movement.description}
                                </p>
                              )}
                            </div>

                            {movement.has_deadline && movement.deadline_date && (
                              <div className="flex items-center gap-2">
                                <div className={`text-right ${isOverdue ? 'text-rose-600' : movement.deadline_completed ? 'text-emerald-600' : 'text-amber-600'}`}>
                                  <div className="flex items-center gap-1 text-xs">
                                    <Calendar className="h-3 w-3" />
                                    {format(new Date(movement.deadline_date), "dd/MM", { locale: ptBR })}
                                  </div>
                                  <div className="text-xs">
                                    {movement.deadline_completed ? 'Concluído' : isOverdue ? 'Vencido' : 'Prazo'}
                                  </div>
                                </div>
                                <Checkbox
                                  checked={movement.deadline_completed}
                                  onCheckedChange={(checked) => 
                                    toggleDeadline.mutate({ id: movement.id, completed: !!checked })
                                  }
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
