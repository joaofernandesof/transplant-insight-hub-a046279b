/**
 * EditAppointmentDialog - Modal para editar/visualizar agendamento
 */

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Calendar, Clock, User, Phone, Mail, FileText, MapPin, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAvivarAgendas, AvivarAgenda } from "@/hooks/useAvivarAgendas";

interface Appointment {
  id: string;
  patient_name: string;
  patient_phone: string;
  patient_email?: string | null;
  appointment_date: string;
  start_time: string;
  end_time: string;
  service_type: string | null;
  status: string;
  notes: string | null;
  location: string | null;
  professional_name: string | null;
  agenda_id: string | null;
}

interface EditAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: Appointment | null;
}

export function EditAppointmentDialog({
  open,
  onOpenChange,
  appointment,
}: EditAppointmentDialogProps) {
  const { agendas } = useAvivarAgendas();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    patient_name: "",
    patient_phone: "",
    patient_email: "",
    service_type: "",
    start_time: "09:00",
    notes: "",
    agenda_id: "",
    location: "",
    status: "scheduled",
  });

  // Update form when appointment changes
  useEffect(() => {
    if (appointment) {
      setFormData({
        patient_name: appointment.patient_name || "",
        patient_phone: appointment.patient_phone || "",
        patient_email: appointment.patient_email || "",
        service_type: appointment.service_type || "",
        start_time: appointment.start_time?.slice(0, 5) || "09:00",
        notes: appointment.notes || "",
        agenda_id: appointment.agenda_id || "",
        location: appointment.location || "",
        status: appointment.status || "scheduled",
      });
    }
  }, [appointment]);

  const updateAppointment = useMutation({
    mutationFn: async () => {
      if (!appointment?.id) throw new Error("Agendamento não encontrado");
      if (!formData.patient_name || !formData.patient_phone) {
        throw new Error("Nome e telefone são obrigatórios");
      }

      // Calculate end time (30 min duration by default)
      const [hours, minutes] = formData.start_time.split(":").map(Number);
      const endHours = minutes >= 30 ? hours + 1 : hours;
      const endMinutes = minutes >= 30 ? minutes - 30 : minutes + 30;
      const end_time = `${endHours.toString().padStart(2, "0")}:${endMinutes.toString().padStart(2, "0")}`;

      const { data, error } = await supabase
        .from("avivar_appointments")
        .update({
          patient_name: formData.patient_name,
          patient_phone: formData.patient_phone,
          patient_email: formData.patient_email || null,
          service_type: formData.service_type || null,
          start_time: formData.start_time,
          end_time: end_time,
          notes: formData.notes || null,
          agenda_id: formData.agenda_id || null,
          location: formData.location || null,
          status: formData.status,
        })
        .eq("id", appointment.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Agendamento atualizado!");
      queryClient.invalidateQueries({ queryKey: ["avivar-appointments"] });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar agendamento");
    },
  });

  const deleteAppointment = useMutation({
    mutationFn: async () => {
      if (!appointment?.id) throw new Error("Agendamento não encontrado");

      const { error } = await supabase
        .from("avivar_appointments")
        .delete()
        .eq("id", appointment.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Agendamento removido!");
      queryClient.invalidateQueries({ queryKey: ["avivar-appointments"] });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao remover agendamento");
    },
  });

  // Generate time slots
  const timeSlots = [];
  for (let hour = 8; hour <= 18; hour++) {
    timeSlots.push(`${hour.toString().padStart(2, "0")}:00`);
    timeSlots.push(`${hour.toString().padStart(2, "0")}:30`);
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateAppointment.mutate();
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "confirmed": return "Confirmado";
      case "pending": return "Pendente";
      case "scheduled": return "Agendado";
      case "cancelled": return "Cancelado";
      case "completed": return "Concluído";
      default: return status;
    }
  };

  if (!appointment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[hsl(var(--avivar-foreground))]">
            <Calendar className="h-5 w-5 text-[hsl(var(--avivar-primary))]" />
            Editar Agendamento
          </DialogTitle>
          <DialogDescription className="text-[hsl(var(--avivar-muted-foreground))]">
            {format(new Date(appointment.appointment_date + "T12:00:00"), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Patient Name */}
          <div className="space-y-2">
            <Label htmlFor="edit_patient_name" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Nome do Paciente *
            </Label>
            <Input
              id="edit_patient_name"
              value={formData.patient_name}
              onChange={(e) =>
                setFormData({ ...formData, patient_name: e.target.value })
              }
              placeholder="Nome completo"
              required
              className="bg-background"
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="edit_patient_phone" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Telefone *
            </Label>
            <Input
              id="edit_patient_phone"
              value={formData.patient_phone}
              onChange={(e) =>
                setFormData({ ...formData, patient_phone: e.target.value })
              }
              placeholder="(00) 00000-0000"
              required
              className="bg-background"
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="edit_patient_email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              E-mail
            </Label>
            <Input
              id="edit_patient_email"
              type="email"
              value={formData.patient_email}
              onChange={(e) =>
                setFormData({ ...formData, patient_email: e.target.value })
              }
              placeholder="email@exemplo.com"
              className="bg-background"
            />
          </div>

          {/* Time and Status Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Time */}
            <div className="space-y-2">
              <Label htmlFor="edit_start_time" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Horário *
              </Label>
              <Select
                value={formData.start_time}
                onValueChange={(value) =>
                  setFormData({ ...formData, start_time: value })
                }
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="edit_status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Agendado</SelectItem>
                  <SelectItem value="confirmed">Confirmado</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Agenda Selection */}
          {agendas.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="edit_agenda_id" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Agenda / Unidade
              </Label>
              <Select
                value={formData.agenda_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, agenda_id: value })
                }
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {agendas.map((agenda) => (
                    <SelectItem key={agenda.id} value={agenda.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: agenda.color }}
                        />
                        {agenda.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Service Type */}
          <div className="space-y-2">
            <Label htmlFor="edit_service_type" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Tipo de Atendimento
            </Label>
            <Input
              id="edit_service_type"
              value={formData.service_type}
              onChange={(e) =>
                setFormData({ ...formData, service_type: e.target.value })
              }
              placeholder="Ex: Consulta, Avaliação, Retorno..."
              className="bg-background"
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="edit_location" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Local / Endereço
            </Label>
            <Input
              id="edit_location"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              placeholder="Endereço ou local do atendimento"
              className="bg-background"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="edit_notes">Observações</Label>
            <Textarea
              id="edit_notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Informações adicionais..."
              rows={3}
              className="bg-background"
            />
          </div>

          <DialogFooter className="gap-2 flex-col sm:flex-row">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="destructive"
                  className="w-full sm:w-auto"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir agendamento?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. O agendamento de{" "}
                    <strong>{appointment.patient_name}</strong> será removido permanentemente.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteAppointment.mutate()}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1 sm:flex-none border-[hsl(var(--avivar-border))]"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={updateAppointment.isPending}
                className="flex-1 sm:flex-none bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-accent))] text-white"
              >
                {updateAppointment.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
