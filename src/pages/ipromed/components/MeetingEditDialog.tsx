/**
 * Modal de edição completa de reunião - inspirado no Google Calendar
 * Permite editar: título, data/horário, local, participantes, pautas/checklists
 */

import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  X,
  Calendar as CalendarIcon,
  MapPin,
  Video,
  Users,
  Bell,
  FileText,
  ChevronDown,
  Plus,
  ClipboardList,
  Loader2,
  ExternalLink,
  Save,
  Trash2,
} from "lucide-react";
import { format, parse } from "date-fns";
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
  participants?: string[];
  created_at: string;
}

interface MeetingEditDialogProps {
  meeting: Meeting | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientName?: string;
}

const timeSlots = Array.from({ length: 24 * 4 }, (_, i) => {
  const hour = Math.floor(i / 4);
  const minute = (i % 4) * 15;
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
});

const durationOptions = [
  { value: 15, label: '15 minutos' },
  { value: 30, label: '30 minutos' },
  { value: 45, label: '45 minutos' },
  { value: 60, label: '1 hora' },
  { value: 90, label: '1h 30min' },
  { value: 120, label: '2 horas' },
];

const meetingTypes = [
  { id: 'onboarding', label: 'Reunião de Onboarding', color: 'bg-emerald-500' },
  { id: 'acompanhamento', label: 'Reunião de Acompanhamento', color: 'bg-blue-500' },
  { id: 'apresentacao_pacote', label: 'Apresentação do Pacote', color: 'bg-purple-500' },
  { id: 'negociacao', label: 'Negociação', color: 'bg-amber-500' },
  { id: 'custom', label: 'Outro', color: 'bg-gray-500' },
];

export function MeetingEditDialog({
  meeting,
  open,
  onOpenChange,
  clientName,
}: MeetingEditDialogProps) {
  const queryClient = useQueryClient();
  const [showOnboardingAgenda, setShowOnboardingAgenda] = useState(false);
  const [showAddChecklist, setShowAddChecklist] = useState(false);
  const [customChecklists, setCustomChecklists] = useState<{id: string; title: string; items: string[]}[]>([]);
  const [newChecklistTitle, setNewChecklistTitle] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [startTime, setStartTime] = useState('09:00');
  const [duration, setDuration] = useState(60);
  const [modality, setModality] = useState<'virtual' | 'presential'>('virtual');
  const [location, setLocation] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [agendaType, setAgendaType] = useState('');
  const [participants, setParticipants] = useState<string[]>([]);
  const [newParticipant, setNewParticipant] = useState('');
  const [reminders, setReminders] = useState<number[]>([30]);

  // Initialize form when meeting changes
  useEffect(() => {
    if (meeting) {
      setTitle(meeting.title || '');
      setDescription(meeting.description || '');
      setSelectedDate(meeting.scheduled_date ? new Date(meeting.scheduled_date) : undefined);
      setStartTime(meeting.scheduled_time || '09:00');
      setDuration(meeting.duration_minutes || 60);
      setModality(meeting.modality === 'presential' ? 'presential' : 'virtual');
      setLocation(meeting.location || '');
      setMeetingLink(meeting.meeting_link || '');
      setAgendaType(meeting.agenda_type || '');
      setParticipants((meeting as any).participants || []);
    }
  }, [meeting]);

  const isOnboardingMeeting = meeting?.title?.toLowerCase().includes('onboarding') || 
                              meeting?.agenda_type === 'onboarding';

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
      toast.success("Reunião atualizada com sucesso!");
      onOpenChange(false);
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
      queryClient.invalidateQueries({ queryKey: ['ipromed-client-activities'] });
      toast.success("Reunião excluída com sucesso!");
      setShowDeleteConfirm(false);
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error("Erro ao excluir reunião: " + error.message);
    },
  });

  const handleSave = () => {
    if (!selectedDate) {
      toast.error("Selecione uma data");
      return;
    }

    updateMeeting.mutate({
      title,
      description,
      scheduled_date: format(selectedDate, 'yyyy-MM-dd'),
      scheduled_time: startTime,
      duration_minutes: duration,
      modality,
      location: modality === 'presential' ? location : '',
      meeting_link: modality === 'virtual' ? meetingLink : '',
      agenda_type: agendaType,
    } as any);
  };

  const handleAddParticipant = () => {
    if (newParticipant.trim()) {
      setParticipants([...participants, newParticipant.trim()]);
      setNewParticipant('');
    }
  };

  const handleRemoveParticipant = (index: number) => {
    setParticipants(participants.filter((_, i) => i !== index));
  };

  const calculateEndTime = () => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + duration;
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = totalMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
  };

  // Show Onboarding Agenda Dialog inside
  if (showOnboardingAgenda && meeting) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[95vh] p-0 overflow-hidden">
          <OnboardingMeetingAgenda
            clientId={meeting.client_id}
            clientName={clientName}
            meetingId={meeting.id}
            onSubmit={(data) => {
              console.log('Onboarding data saved:', data);
              queryClient.invalidateQueries({ queryKey: ['ipromed-client-meetings'] });
              queryClient.invalidateQueries({ queryKey: ['ipromed-client-activities'] });
              setShowOnboardingAgenda(false);
            }}
            onClose={() => setShowOnboardingAgenda(false)}
          />
        </DialogContent>
      </Dialog>
    );
  }

  if (!meeting) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[95vh] p-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-muted/30">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-5 w-5" />
            </Button>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título da reunião"
              className="text-lg font-semibold border-0 bg-transparent focus-visible:ring-0 px-0"
            />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button onClick={handleSave} disabled={updateMeeting.isPending}>
              {updateMeeting.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Mais ações
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Duplicar reunião</DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-destructive focus:text-destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir reunião
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <ScrollArea className="flex-1 max-h-[calc(95vh-80px)]">
          <div className="p-6 space-y-6">
            {/* Date & Time Row - Google Calendar style */}
            <div className="flex flex-wrap items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="font-normal">
                    <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                    {selectedDate ? format(selectedDate, "d 'de' MMMM yyyy", { locale: ptBR }) : 'Selecionar data'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    locale={ptBR}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>

              <Select value={startTime} onValueChange={setStartTime}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.filter((_, i) => i % 2 === 0).map((time) => (
                    <SelectItem key={time} value={time}>{time}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <span className="text-muted-foreground">até</span>

              <Button variant="outline" size="sm" className="font-normal" disabled>
                {calculateEndTime()}
              </Button>

              <Select value={duration.toString()} onValueChange={(v) => setDuration(Number(v))}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {durationOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value.toString()}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* All Details in single view - no tabs */}
            <div className="space-y-4">
              {/* Meeting Link / Location */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-lg",
                    modality === 'virtual' ? "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400" : "bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-400"
                  )}>
                    {modality === 'virtual' ? <Video className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex gap-2">
                      <Button
                        variant={modality === 'virtual' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setModality('virtual')}
                      >
                        Virtual
                      </Button>
                      <Button
                        variant={modality === 'presential' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setModality('presential')}
                      >
                        Presencial
                      </Button>
                    </div>
                    {modality === 'virtual' ? (
                      <Input
                        placeholder="Link da reunião (Google Meet, Zoom, etc.)"
                        value={meetingLink}
                        onChange={(e) => setMeetingLink(e.target.value)}
                        className="text-sm"
                      />
                    ) : (
                      <Input
                        placeholder="Endereço do local"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="text-sm"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Notifications */}
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <Bell className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <span className="text-sm font-medium">Notificações</span>
                </div>
                
                <div className="ml-11 space-y-2">
                  {reminders.map((reminder, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Select 
                        value={reminder.toString()} 
                        onValueChange={(v) => {
                          const newReminders = [...reminders];
                          newReminders[index] = Number(v);
                          setReminders(newReminders);
                        }}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10 minutos antes</SelectItem>
                          <SelectItem value="30">30 minutos antes</SelectItem>
                          <SelectItem value="60">1 hora antes</SelectItem>
                          <SelectItem value="1440">1 dia antes</SelectItem>
                        </SelectContent>
                      </Select>
                      {reminders.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => setReminders(reminders.filter((_, i) => i !== index))}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-primary gap-1"
                    onClick={() => setReminders([...reminders, 30])}
                  >
                    <Plus className="h-4 w-4" />
                    Adicionar notificação
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Description */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Descrição
                </Label>
                <Textarea
                  placeholder="Adicione uma descrição ou notas para a reunião..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>

              {/* Participants */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  Participantes
                </Label>
                
                {/* Client as participant */}
                {clientName && (
                  <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
                      {clientName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{clientName}</p>
                      <p className="text-xs text-muted-foreground">Cliente</p>
                    </div>
                    <Badge variant="outline" className="text-xs">Organizador</Badge>
                  </div>
                )}

                {/* Additional participants */}
                {participants.map((participant, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground text-sm font-medium">
                      {participant.charAt(0).toUpperCase()}
                    </div>
                    <span className="flex-1 text-sm">{participant}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleRemoveParticipant(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}

                <div className="flex gap-2">
                  <Input
                    placeholder="Adicionar participante (email ou nome)"
                    value={newParticipant}
                    onChange={(e) => setNewParticipant(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddParticipant()}
                    className="flex-1"
                  />
                  <Button size="sm" onClick={handleAddParticipant}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Checklists Section */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <ClipboardList className="h-4 w-4 text-muted-foreground" />
                  Checklists da Reunião
                </Label>

                {/* Onboarding Checklist Card */}
                {isOnboardingMeeting && (
                  <div 
                    className="p-4 border rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setShowOnboardingAgenda(true)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900 rounded-lg">
                          <ClipboardList className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                          <p className="font-medium text-emerald-800 dark:text-emerald-200">
                            Checklist de Onboarding
                          </p>
                          <p className="text-sm text-emerald-600 dark:text-emerald-400">
                            17 itens documentais a verificar
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-emerald-500 text-white">Principal</Badge>
                        <ExternalLink className="h-4 w-4 text-emerald-600" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Custom checklists added */}
                {customChecklists.map((checklist) => (
                  <div 
                    key={checklist.id}
                    className="p-4 border rounded-lg bg-muted/30 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <ClipboardList className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{checklist.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {checklist.items.length} itens
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setCustomChecklists(prev => prev.filter(c => c.id !== checklist.id))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                {/* Option to add more checklists */}
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setShowAddChecklist(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar checklist de pauta
                </Button>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>

    {/* Confirmação de Exclusão */}
    <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir reunião?</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir a reunião "{meeting?.title}"? Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMeeting.isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => deleteMeeting.mutate()}
            disabled={deleteMeeting.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteMeeting.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    {/* Dialog para adicionar checklist */}
    <Dialog open={showAddChecklist} onOpenChange={setShowAddChecklist}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Checklist de Pauta</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="checklist-title">Título do Checklist</Label>
            <Input
              id="checklist-title"
              placeholder="Ex: Documentos a apresentar"
              value={newChecklistTitle}
              onChange={(e) => setNewChecklistTitle(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => {
                setShowAddChecklist(false);
                setNewChecklistTitle('');
              }}
            >
              Cancelar
            </Button>
            <Button 
              className="flex-1"
              disabled={!newChecklistTitle.trim()}
              onClick={() => {
                setCustomChecklists(prev => [
                  ...prev, 
                  { 
                    id: crypto.randomUUID(), 
                    title: newChecklistTitle.trim(),
                    items: []
                  }
                ]);
                setNewChecklistTitle('');
                setShowAddChecklist(false);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Criar Checklist
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
