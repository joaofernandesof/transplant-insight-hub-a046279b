/**
 * Modal para agendar reunião com cliente
 * Com opções de pautas pré-configuradas e pautas avulsas
 */

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Calendar as CalendarIcon,
  Clock,
  Video,
  MapPin,
  FileText,
  Plus,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { logClientActivity } from "./ClientActivityTimeline";

// Pautas pré-configuradas
const predefinedAgendas = [
  {
    id: "onboarding",
    name: "Reunião de Onboarding",
    description: "Primeira reunião com o cliente para entender necessidades e apresentar serviços",
    duration: 60,
    topics: [
      "Apresentação do escritório e equipe",
      "Entendimento das necessidades jurídicas",
      "Coleta de documentos iniciais",
      "Apresentação do Plano Preventivo Integral",
      "Alinhamento de expectativas",
      "Definição de próximos passos",
    ],
  },
  {
    id: "apresentacao_pacote",
    name: "Apresentação do Pacote Jurídico",
    description: "Apresentação detalhada do pacote jurídico e serviços inclusos",
    duration: 45,
    topics: [
      "Revisão do pacote contratado",
      "Detalhamento dos serviços inclusos",
      "Canais de comunicação e suporte",
      "Prazos e responsabilidades",
      "Dúvidas e esclarecimentos",
    ],
  },
  {
    id: "acompanhamento",
    name: "Reunião de Acompanhamento",
    description: "Reunião periódica para acompanhar o andamento dos processos",
    duration: 30,
    topics: [
      "Status dos processos em andamento",
      "Novas demandas identificadas",
      "Revisão de prazos",
      "Alinhamento de estratégias",
    ],
  },
  {
    id: "renovacao",
    name: "Reunião de Renovação",
    description: "Discussão sobre renovação contratual e novos termos",
    duration: 45,
    topics: [
      "Avaliação do período anterior",
      "Apresentação de resultados",
      "Proposta de renovação",
      "Novos serviços disponíveis",
      "Negociação de valores",
    ],
  },
  {
    id: "feedback",
    name: "Coleta de Feedback",
    description: "Reunião para coletar feedback sobre os serviços prestados",
    duration: 30,
    topics: [
      "Satisfação com os serviços",
      "Pontos de melhoria",
      "Sugestões e recomendações",
      "NPS e avaliação geral",
    ],
  },
];

const timeSlots = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
];

interface MeetingScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  clientName: string;
  onSchedule?: (data: any) => void;
}

export function MeetingScheduleDialog({
  open,
  onOpenChange,
  clientId,
  clientName,
  onSchedule,
}: MeetingScheduleDialogProps) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<"agenda" | "details">("agenda");
  const [agendaType, setAgendaType] = useState<"predefined" | "custom">("predefined");
  const [selectedAgenda, setSelectedAgenda] = useState<string>("");
  const [customAgenda, setCustomAgenda] = useState({
    name: "",
    description: "",
    topics: "",
  });
  const [meetingDetails, setMeetingDetails] = useState({
    date: undefined as Date | undefined,
    time: "",
    duration: 30,
    modality: "virtual" as "virtual" | "presencial",
    location: "",
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedPredefinedAgenda = predefinedAgendas.find(a => a.id === selectedAgenda);

  const handleNext = () => {
    if (agendaType === "predefined" && !selectedAgenda) {
      toast.error("Selecione uma pauta para continuar");
      return;
    }
    if (agendaType === "custom" && !customAgenda.name.trim()) {
      toast.error("Informe o título da pauta para continuar");
      return;
    }
    setStep("details");
  };

  const handleSchedule = async () => {
    if (!meetingDetails.date) {
      toast.error("Selecione uma data para a reunião");
      return;
    }
    if (!meetingDetails.time) {
      toast.error("Selecione um horário para a reunião");
      return;
    }

    setIsSubmitting(true);
    try {
      const agenda = agendaType === "predefined" 
        ? selectedPredefinedAgenda 
        : {
            id: 'custom',
            name: customAgenda.name,
            description: customAgenda.description,
            topics: customAgenda.topics.split("\n").filter(t => t.trim()),
          };

      // Save to database
      const { data: meetingData, error } = await supabase
        .from('ipromed_client_meetings' as any)
        .insert({
          client_id: clientId,
          title: agenda?.name || 'Reunião',
          description: agenda?.description || '',
          agenda_type: agendaType === "predefined" ? selectedAgenda : 'custom',
          agenda_topics: agenda?.topics || [],
          scheduled_date: format(meetingDetails.date, 'yyyy-MM-dd'),
          scheduled_time: meetingDetails.time,
          duration_minutes: meetingDetails.duration,
          modality: meetingDetails.modality,
          location: meetingDetails.location || null,
          meeting_notes: meetingDetails.notes || null,
          status: 'scheduled',
        })
        .select()
        .single();

      if (error) throw error;
      
      const meeting = meetingData as unknown as { id: string };

      // Log activity
      await logClientActivity(
        clientId,
        'meeting',
        'scheduled',
        `Reunião agendada: ${agenda?.name}`,
        {
          description: `${format(meetingDetails.date, "dd/MM/yyyy", { locale: ptBR })} às ${meetingDetails.time}`,
          metadata: {
            meeting_id: meeting?.id,
            modality: meetingDetails.modality,
            duration: meetingDetails.duration,
          },
          referenceType: 'meeting',
          referenceId: meeting?.id,
        }
      );

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['ipromed-client-meetings', clientId] });
      queryClient.invalidateQueries({ queryKey: ['ipromed-client-activities', clientId] });

      if (onSchedule) {
        onSchedule({ meeting, agenda });
      }

      toast.success("Reunião agendada com sucesso!");
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      console.error("Error scheduling meeting:", error);
      toast.error("Erro ao agendar reunião: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setStep("agenda");
    setAgendaType("predefined");
    setSelectedAgenda("");
    setCustomAgenda({ name: "", description: "", topics: "" });
    setMeetingDetails({
      date: undefined,
      time: "",
      duration: 30,
      modality: "virtual",
      location: "",
      notes: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => {
      if (!v) resetForm();
      onOpenChange(v);
    }}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            Agendar Reunião
          </DialogTitle>
          <DialogDescription>
            Cliente: <span className="font-medium text-foreground">{clientName}</span>
          </DialogDescription>
        </DialogHeader>

        {step === "agenda" ? (
          <div className="space-y-4">
            {/* Tipo de Pauta */}
            <RadioGroup
              value={agendaType}
              onValueChange={(v) => setAgendaType(v as "predefined" | "custom")}
              className="grid grid-cols-2 gap-4"
            >
              <div>
                <RadioGroupItem value="predefined" id="predefined" className="peer sr-only" />
                <Label
                  htmlFor="predefined"
                  className={cn(
                    "flex flex-col items-center justify-center rounded-lg border-2 p-4 cursor-pointer transition-all",
                    "hover:border-primary/50",
                    agendaType === "predefined" ? "border-primary bg-primary/5" : "border-muted"
                  )}
                >
                  <FileText className="h-8 w-8 mb-2 text-primary" />
                  <span className="font-medium">Pauta Pré-configurada</span>
                  <span className="text-xs text-muted-foreground text-center mt-1">
                    Escolha entre pautas prontas
                  </span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="custom" id="custom" className="peer sr-only" />
                <Label
                  htmlFor="custom"
                  className={cn(
                    "flex flex-col items-center justify-center rounded-lg border-2 p-4 cursor-pointer transition-all",
                    "hover:border-primary/50",
                    agendaType === "custom" ? "border-primary bg-primary/5" : "border-muted"
                  )}
                >
                  <Plus className="h-8 w-8 mb-2 text-primary" />
                  <span className="font-medium">Pauta Avulsa</span>
                  <span className="text-xs text-muted-foreground text-center mt-1">
                    Crie uma pauta personalizada
                  </span>
                </Label>
              </div>
            </RadioGroup>

            {/* Seleção de Pauta Pré-configurada */}
            {agendaType === "predefined" && (
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-2">
                  {predefinedAgendas.map((agenda) => (
                    <div
                      key={agenda.id}
                      className={cn(
                        "p-4 rounded-lg border-2 cursor-pointer transition-all hover:border-primary/50",
                        selectedAgenda === agenda.id
                          ? "border-primary bg-primary/5"
                          : "border-muted"
                      )}
                      onClick={() => setSelectedAgenda(agenda.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">{agenda.name}</h4>
                          <p className="text-sm text-muted-foreground">{agenda.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            <Clock className="h-3 w-3 mr-1" />
                            {agenda.duration}min
                          </Badge>
                          {selectedAgenda === agenda.id && (
                            <CheckCircle2 className="h-5 w-5 text-primary" />
                          )}
                        </div>
                      </div>
                      {selectedAgenda === agenda.id && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-xs font-medium text-muted-foreground mb-2">Tópicos:</p>
                          <ul className="space-y-1">
                            {agenda.topics.map((topic, i) => (
                              <li key={i} className="text-sm flex items-start gap-2">
                                <span className="text-primary mt-1">•</span>
                                {topic}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}

            {/* Pauta Personalizada */}
            {agendaType === "custom" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="custom-name">Título da Reunião *</Label>
                  <Input
                    id="custom-name"
                    placeholder="Ex: Reunião de Alinhamento Estratégico"
                    value={customAgenda.name}
                    onChange={(e) => setCustomAgenda({ ...customAgenda, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="custom-description">Descrição</Label>
                  <Input
                    id="custom-description"
                    placeholder="Breve descrição do objetivo da reunião"
                    value={customAgenda.description}
                    onChange={(e) => setCustomAgenda({ ...customAgenda, description: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="custom-topics">Tópicos (um por linha)</Label>
                  <Textarea
                    id="custom-topics"
                    placeholder={"Ex:\nApresentação de resultados\nDiscussão de estratégias\nAlinhamento de expectativas"}
                    value={customAgenda.topics}
                    onChange={(e) => setCustomAgenda({ ...customAgenda, topics: e.target.value })}
                    rows={5}
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Resumo da Pauta */}
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium">
                {agendaType === "predefined" ? selectedPredefinedAgenda?.name : customAgenda.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {agendaType === "predefined" 
                  ? `${selectedPredefinedAgenda?.topics.length} tópicos • ${selectedPredefinedAgenda?.duration}min` 
                  : `${customAgenda.topics.split("\n").filter(t => t.trim()).length} tópicos`}
              </p>
            </div>

            {/* Data e Hora */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !meetingDetails.date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {meetingDetails.date 
                        ? format(meetingDetails.date, "dd/MM/yyyy", { locale: ptBR }) 
                        : "Selecione"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={meetingDetails.date}
                      onSelect={(date) => setMeetingDetails({ ...meetingDetails, date })}
                      disabled={(date) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        return date < today;
                      }}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Horário *</Label>
                <Select
                  value={meetingDetails.time}
                  onValueChange={(v) => setMeetingDetails({ ...meetingDetails, time: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((time) => (
                      <SelectItem key={time} value={time}>{time}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Duração */}
            <div className="space-y-2">
              <Label>Duração</Label>
              <Select
                value={meetingDetails.duration.toString()}
                onValueChange={(v) => setMeetingDetails({ ...meetingDetails, duration: parseInt(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutos</SelectItem>
                  <SelectItem value="30">30 minutos</SelectItem>
                  <SelectItem value="45">45 minutos</SelectItem>
                  <SelectItem value="60">1 hora</SelectItem>
                  <SelectItem value="90">1h30</SelectItem>
                  <SelectItem value="120">2 horas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Modalidade */}
            <div className="space-y-2">
              <Label>Modalidade</Label>
              <RadioGroup
                value={meetingDetails.modality}
                onValueChange={(v) => setMeetingDetails({ ...meetingDetails, modality: v as "virtual" | "presencial" })}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="virtual" id="virtual" />
                  <Label htmlFor="virtual" className="flex items-center gap-1 cursor-pointer">
                    <Video className="h-4 w-4" />
                    Virtual
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="presencial" id="presencial" />
                  <Label htmlFor="presencial" className="flex items-center gap-1 cursor-pointer">
                    <MapPin className="h-4 w-4" />
                    Presencial
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Local (se presencial) */}
            {meetingDetails.modality === "presencial" && (
              <div className="space-y-2">
                <Label htmlFor="location">Local</Label>
                <Input
                  id="location"
                  placeholder="Endereço da reunião"
                  value={meetingDetails.location}
                  onChange={(e) => setMeetingDetails({ ...meetingDetails, location: e.target.value })}
                />
              </div>
            )}

            {/* Observações */}
            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                placeholder="Informações adicionais para a reunião..."
                value={meetingDetails.notes}
                onChange={(e) => setMeetingDetails({ ...meetingDetails, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          {step === "details" && (
            <Button variant="outline" onClick={() => setStep("agenda")}>
              Voltar
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          {step === "agenda" ? (
            <Button onClick={handleNext}>
              Continuar
            </Button>
          ) : (
            <Button onClick={handleSchedule} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Agendar Reunião
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
