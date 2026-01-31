/**
 * NewAppointmentDialog - Modal para criar agendamento manual
 */

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Calendar, Clock, User, Phone, Mail, FileText, MapPin } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext";
import { useAvivarAgendas, AvivarAgenda } from "@/hooks/useAvivarAgendas";

interface NewAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date;
  selectedTime?: string;
  selectedAgenda?: AvivarAgenda | null;
}

export function NewAppointmentDialog({
  open,
  onOpenChange,
  selectedDate,
  selectedTime,
  selectedAgenda,
}: NewAppointmentDialogProps) {
  const { user } = useUnifiedAuth();
  const { agendas } = useAvivarAgendas();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    patient_name: "",
    patient_phone: "",
    patient_email: "",
    service_type: "",
    start_time: selectedTime || "09:00",
    notes: "",
    agenda_id: selectedAgenda?.id || "",
    location: "",
  });

  // Keep agenda_id aligned with the currently selected agenda when opening the dialog
  useEffect(() => {
    if (!open) return;
    if (!selectedAgenda?.id) return;
    setFormData((prev) => ({
      ...prev,
      agenda_id: prev.agenda_id || selectedAgenda.id,
    }));
  }, [open, selectedAgenda?.id]);

  // Reset form when dialog opens
  const handleOpenChange = (open: boolean) => {
    if (open) {
      setFormData({
        patient_name: "",
        patient_phone: "",
        patient_email: "",
        service_type: "",
        start_time: selectedTime || "09:00",
        notes: "",
        agenda_id: selectedAgenda?.id || "",
        location: "",
      });
    }
    onOpenChange(open);
  };

  const createAppointment = useMutation({
    mutationFn: async () => {
      // Get the actual auth user ID from Supabase
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser?.id) throw new Error("Usuário não autenticado");
      if (!formData.patient_name || !formData.patient_phone) {
        throw new Error("Nome e telefone são obrigatórios");
      }

      // Normalize phone number for comparison (remove non-digits)
      const normalizedPhone = formData.patient_phone.replace(/\D/g, "");

      // Check if this phone already has an active appointment
      const { data: existingAppointment } = await supabase
        .from("avivar_appointments")
        .select("id")
        .eq("user_id", authUser.id)
        .eq("status", "scheduled")
        .or(`patient_phone.eq.${formData.patient_phone},patient_phone.eq.${normalizedPhone}`)
        .maybeSingle();

      // Calculate end time (30 min duration by default)
      const [hours, minutes] = formData.start_time.split(":").map(Number);
      const endHours = minutes >= 30 ? hours + 1 : hours;
      const endMinutes = minutes >= 30 ? minutes - 30 : minutes + 30;
      const end_time = `${endHours.toString().padStart(2, "0")}:${endMinutes.toString().padStart(2, "0")}`;

      const agendaIdToSave = formData.agenda_id || selectedAgenda?.id || null;

      if (existingAppointment) {
        // Reschedule existing appointment instead of creating new one
        const { data, error } = await supabase
          .from("avivar_appointments")
          .update({
            patient_name: formData.patient_name,
            patient_email: formData.patient_email || null,
            service_type: formData.service_type || null,
            appointment_date: format(selectedDate, "yyyy-MM-dd"),
            start_time: formData.start_time,
            end_time: end_time,
            notes: formData.notes || null,
            agenda_id: agendaIdToSave,
            location: formData.location || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingAppointment.id)
          .select()
          .single();

        if (error) throw error;
        return { data, rescheduled: true };
      } else {
        // Create new appointment
        const { data, error } = await supabase
          .from("avivar_appointments")
          .insert({
            user_id: authUser.id,
            patient_name: formData.patient_name,
            patient_phone: formData.patient_phone,
            patient_email: formData.patient_email || null,
            service_type: formData.service_type || null,
            appointment_date: format(selectedDate, "yyyy-MM-dd"),
            start_time: formData.start_time,
            end_time: end_time,
            notes: formData.notes || null,
            agenda_id: agendaIdToSave,
            location: formData.location || null,
            status: "scheduled",
            created_by: "manual",
          })
          .select()
          .single();

        if (error) throw error;
        return { data, rescheduled: false };
      }
    },
    onSuccess: (result) => {
      if (result.rescheduled) {
        toast.success("Agendamento reagendado com sucesso!");
      } else {
        toast.success("Agendamento criado com sucesso!");
      }
      queryClient.invalidateQueries({ 
        queryKey: ["avivar-appointments"],
        refetchType: 'active'
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao criar agendamento");
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
    createAppointment.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[hsl(var(--avivar-foreground))]">
            <Calendar className="h-5 w-5 text-[hsl(var(--avivar-primary))]" />
            Novo Agendamento
          </DialogTitle>
          <DialogDescription className="text-[hsl(var(--avivar-muted-foreground))]">
            {format(selectedDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Patient Name */}
          <div className="space-y-2">
            <Label htmlFor="patient_name" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Nome do Paciente *
            </Label>
            <Input
              id="patient_name"
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
            <Label htmlFor="patient_phone" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Telefone *
            </Label>
            <Input
              id="patient_phone"
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
            <Label htmlFor="patient_email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              E-mail
            </Label>
            <Input
              id="patient_email"
              type="email"
              value={formData.patient_email}
              onChange={(e) =>
                setFormData({ ...formData, patient_email: e.target.value })
              }
              placeholder="email@exemplo.com"
              className="bg-background"
            />
          </div>

          {/* Time */}
          <div className="space-y-2">
            <Label htmlFor="start_time" className="flex items-center gap-2">
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

          {/* Service Type */}
          <div className="space-y-2">
            <Label htmlFor="service_type" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Tipo de Atendimento
            </Label>
            <Input
              id="service_type"
              value={formData.service_type}
              onChange={(e) =>
                setFormData({ ...formData, service_type: e.target.value })
              }
              placeholder="Ex: Consulta, Avaliação, Retorno..."
              className="bg-background"
            />
          </div>

          {/* Location (for itinerant doctors) */}
          <div className="space-y-2">
            <Label htmlFor="location" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Local / Endereço
            </Label>
            <Input
              id="location"
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
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Informações adicionais..."
              rows={3}
              className="bg-background"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-[hsl(var(--avivar-border))]"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createAppointment.isPending}
              className="bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-accent))] text-white"
            >
              {createAppointment.isPending ? "Criando..." : "Criar Agendamento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
