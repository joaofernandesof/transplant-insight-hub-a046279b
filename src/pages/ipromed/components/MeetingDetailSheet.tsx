/**
 * Sheet para visualizar e editar detalhes de uma reunião
 * Permite preencher checklist, editar, excluir e gerar ATA
 * Integra com o formulário completo de Onboarding quando aplicável
 */

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Video,
  MapPin,
  Clock,
  Calendar,
  Trash2,
  Edit,
  FileText,
  Check,
  Play,
  Pause,
  CheckCircle2,
  Loader2,
  Download,
  Copy,
  ClipboardList,
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import OnboardingMeetingAgenda from "./OnboardingMeetingAgenda";

interface Meeting {
  id: string;
  client_id: string;
  title: string;
  description?: string;
  agenda_type?: string;
  agenda_topics?: string[];
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes?: number;
  modality?: string;
  location?: string;
  meeting_link?: string;
  meeting_notes?: string;
  status: string;
  minutes?: string;
  action_items?: string[];
  created_at: string;
}

interface MeetingDetailSheetProps {
  meeting: Meeting | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientName?: string;
}

export function MeetingDetailSheet({
  meeting,
  open,
  onOpenChange,
  clientName,
}: MeetingDetailSheetProps) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [onboardingDialogOpen, setOnboardingDialogOpen] = useState(false);
  const [topicsCompleted, setTopicsCompleted] = useState<Record<number, boolean>>({});
  const [meetingNotes, setMeetingNotes] = useState(meeting?.meeting_notes || "");
  const [minutesText, setMinutesText] = useState(meeting?.minutes || "");
  const [actionItems, setActionItems] = useState<string[]>(meeting?.action_items || []);
  const [newActionItem, setNewActionItem] = useState("");

  // Detect if this is an onboarding meeting
  const isOnboardingMeeting = meeting?.title?.toLowerCase().includes('onboarding') || 
                              meeting?.agenda_type === 'onboarding';

  // Reset state when meeting changes
  useState(() => {
    if (meeting) {
      setMeetingNotes(meeting.meeting_notes || "");
      setMinutesText(meeting.minutes || "");
      setActionItems(meeting.action_items || []);
      setTopicsCompleted({});
    }
  });

  // Update meeting mutation
  const updateMeeting = useMutation({
    mutationFn: async (updates: Partial<Meeting>) => {
      const { error } = await supabase
        .from('ipromed_client_meetings' as any)
        .update(updates)
        .eq('id', meeting?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ipromed-client-meetings'] });
      queryClient.invalidateQueries({ queryKey: ['ipromed-appointments-astrea'] });
      toast.success("Reunião atualizada!");
    },
    onError: (error: any) => {
      toast.error("Erro ao atualizar: " + error.message);
    },
  });

  // Delete meeting mutation
  const deleteMeeting = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('ipromed_client_meetings' as any)
        .delete()
        .eq('id', meeting?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ipromed-client-meetings'] });
      queryClient.invalidateQueries({ queryKey: ['ipromed-appointments-astrea'] });
      toast.success("Reunião excluída!");
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error("Erro ao excluir: " + error.message);
    },
  });

  if (!meeting) return null;

  const topics = meeting.agenda_topics || [];
  const completedCount = Object.values(topicsCompleted).filter(Boolean).length;
  const allTopicsCompleted = topics.length > 0 && completedCount === topics.length;

  const handleStartMeeting = () => {
    updateMeeting.mutate({
      status: 'in_progress',
      started_at: new Date().toISOString(),
    } as any);
  };

  const handleCompleteMeeting = () => {
    updateMeeting.mutate({
      status: 'completed',
      ended_at: new Date().toISOString(),
      meeting_notes: meetingNotes,
      minutes: minutesText,
      action_items: actionItems,
    } as any);
  };

  const handleSaveNotes = () => {
    updateMeeting.mutate({
      meeting_notes: meetingNotes,
      minutes: minutesText,
      action_items: actionItems,
    } as any);
  };

  const handleAddActionItem = () => {
    if (newActionItem.trim()) {
      setActionItems([...actionItems, newActionItem.trim()]);
      setNewActionItem("");
    }
  };

  const handleRemoveActionItem = (index: number) => {
    setActionItems(actionItems.filter((_, i) => i !== index));
  };

  const generateATA = () => {
    const ata = `
ATA DE REUNIÃO
==============

${meeting.title}
${clientName ? `Cliente: ${clientName}` : ''}

Data: ${format(new Date(meeting.scheduled_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
Horário: ${meeting.scheduled_time}
Modalidade: ${meeting.modality === 'virtual' ? 'Virtual' : 'Presencial'}
${meeting.location ? `Local: ${meeting.location}` : ''}

PAUTA
-----
${topics.map((topic, i) => `${i + 1}. ${topic}`).join('\n')}

NOTAS DA REUNIÃO
----------------
${meetingNotes || 'Sem notas registradas'}

AÇÕES A REALIZAR
----------------
${actionItems.length > 0 ? actionItems.map((item, i) => `${i + 1}. ${item}`).join('\n') : 'Nenhuma ação definida'}

---
Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
    `.trim();

    setMinutesText(ata);
    toast.success("ATA gerada com sucesso!");
  };

  const copyATA = () => {
    navigator.clipboard.writeText(minutesText);
    toast.success("ATA copiada para a área de transferência!");
  };

  const statusConfig: Record<string, { label: string; color: string }> = {
    scheduled: { label: 'Agendada', color: 'bg-blue-500' },
    in_progress: { label: 'Em andamento', color: 'bg-amber-500' },
    completed: { label: 'Realizada', color: 'bg-emerald-500' },
    cancelled: { label: 'Cancelada', color: 'bg-gray-500' },
  };

  const status = statusConfig[meeting.status] || statusConfig.scheduled;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-[600px] overflow-hidden flex flex-col">
          <SheetHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <SheetTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5 text-primary" />
                  {meeting.title}
                </SheetTitle>
                <SheetDescription>
                  {clientName && <span className="font-medium">{clientName}</span>}
                </SheetDescription>
              </div>
              <Badge className={cn("text-white", status.color)}>
                {status.label}
              </Badge>
            </div>
          </SheetHeader>

          <ScrollArea className="flex-1 -mx-6 px-6">
            <div className="space-y-6 py-4">
              {/* Meeting Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{format(new Date(meeting.scheduled_date), "dd/MM/yyyy", { locale: ptBR })}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{meeting.scheduled_time}</span>
                  {meeting.duration_minutes && (
                    <span className="text-muted-foreground">({meeting.duration_minutes}min)</span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {meeting.modality === 'virtual' ? (
                    <Video className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span>{meeting.modality === 'virtual' ? 'Virtual' : 'Presencial'}</span>
                </div>
                {meeting.location && (
                  <div className="flex items-center gap-2 text-sm col-span-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{meeting.location}</span>
                  </div>
                )}
              </div>

              <Separator />

              {/* Onboarding Checklist Button - Opens centered dialog */}
              {isOnboardingMeeting && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <ClipboardList className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm mb-1">Checklist de Onboarding</h4>
                      <p className="text-xs text-muted-foreground mb-3">
                        Formulário completo com 10 seções: Boas-vindas, Perfil, Comunicação, 
                        Documentos, Entregas, Prioridades, Prazos, Treinamento, Instagram e Contrato.
                      </p>
                      <Button 
                        onClick={() => setOnboardingDialogOpen(true)}
                        className="gap-2"
                        size="sm"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Abrir Checklist Completo
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Non-Onboarding Agenda Topics */}
              {!isOnboardingMeeting && topics.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Pauta da Reunião</Label>
                    <span className="text-xs text-muted-foreground">
                      {completedCount}/{topics.length} concluídos
                    </span>
                  </div>
                  <div className="space-y-2">
                    {topics.map((topic, index) => (
                      <div
                        key={index}
                        className={cn(
                          "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                          topicsCompleted[index] ? "bg-emerald-50 border-emerald-200" : "bg-muted/30"
                        )}
                      >
                        <Checkbox
                          id={`topic-${index}`}
                          checked={topicsCompleted[index] || false}
                          onCheckedChange={(checked) =>
                            setTopicsCompleted({ ...topicsCompleted, [index]: !!checked })
                          }
                        />
                        <label
                          htmlFor={`topic-${index}`}
                          className={cn(
                            "text-sm cursor-pointer flex-1",
                            topicsCompleted[index] && "line-through text-muted-foreground"
                          )}
                        >
                          {topic}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Meeting Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notas da Reunião</Label>
                <Textarea
                  id="notes"
                  placeholder="Registre as anotações importantes da reunião..."
                  value={meetingNotes}
                  onChange={(e) => setMeetingNotes(e.target.value)}
                  rows={4}
                />
              </div>

              {/* Action Items */}
              <div className="space-y-2">
                <Label>Ações a Realizar</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Nova ação..."
                    value={newActionItem}
                    onChange={(e) => setNewActionItem(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddActionItem()}
                  />
                  <Button size="sm" onClick={handleAddActionItem}>
                    Adicionar
                  </Button>
                </div>
                {actionItems.length > 0 && (
                  <div className="space-y-1 mt-2">
                    {actionItems.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm"
                      >
                        <span>{item}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleRemoveActionItem(index)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* ATA / Minutes */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="minutes">ATA da Reunião</Label>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" onClick={generateATA}>
                      <FileText className="h-3 w-3 mr-1" />
                      Gerar ATA
                    </Button>
                    {minutesText && (
                      <Button variant="outline" size="sm" onClick={copyATA}>
                        <Copy className="h-3 w-3 mr-1" />
                        Copiar
                      </Button>
                    )}
                  </div>
                </div>
                <Textarea
                  id="minutes"
                  placeholder="A ATA será gerada automaticamente..."
                  value={minutesText}
                  onChange={(e) => setMinutesText(e.target.value)}
                  rows={8}
                  className="font-mono text-xs"
                />
              </div>
            </div>
          </ScrollArea>

          <SheetFooter className="border-t pt-4 flex-col sm:flex-row gap-2">
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Excluir
              </Button>
            </div>
            <div className="flex gap-2 flex-1 justify-end">
              {meeting.status === 'scheduled' && (
                <Button variant="outline" onClick={handleStartMeeting}>
                  <Play className="h-4 w-4 mr-1" />
                  Iniciar
                </Button>
              )}
              <Button
                onClick={allTopicsCompleted ? handleCompleteMeeting : handleSaveNotes}
                disabled={updateMeeting.isPending}
              >
                {updateMeeting.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                {allTopicsCompleted ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Concluir Reunião
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Salvar
                  </>
                )}
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Reunião</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta reunião? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMeeting.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMeeting.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Excluir"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Onboarding Checklist Dialog - Centered */}
      <Dialog open={onboardingDialogOpen} onOpenChange={setOnboardingDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[95vh] p-0 overflow-hidden">
          <OnboardingMeetingAgenda
            clientId={meeting?.client_id}
            clientName={clientName}
            meetingId={meeting?.id}
            onSubmit={(data) => {
              console.log('Onboarding data saved:', data);
              queryClient.invalidateQueries({ queryKey: ['ipromed-client-meetings'] });
              queryClient.invalidateQueries({ queryKey: ['ipromed-client-activities'] });
              setOnboardingDialogOpen(false);
            }}
            onClose={() => setOnboardingDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
