/**
 * AvivarAgenda - Página de Agenda do Portal Avivar
 * Gerenciamento de agendamentos e disponibilidade
 */

import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Clock, Calendar as CalendarIcon, User, Phone, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext";

interface Appointment {
  id: string;
  patient_name: string;
  patient_phone: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  service_type: string | null;
  status: string;
  notes: string | null;
}

export default function AvivarAgenda() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [view, setView] = useState<"day" | "week">("day");
  const { user } = useUnifiedAuth();

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['avivar-appointments', user?.id, format(selectedDate, 'yyyy-MM-dd')],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const startOfWeekDate = startOfWeek(selectedDate, { weekStartsOn: 0 });
      const endOfWeekDate = addDays(startOfWeekDate, 6);
      
      const { data, error } = await supabase
        .from('avivar_appointments')
        .select('*')
        .eq('user_id', user.id)
        .gte('appointment_date', format(startOfWeekDate, 'yyyy-MM-dd'))
        .lte('appointment_date', format(endOfWeekDate, 'yyyy-MM-dd'))
        .order('appointment_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;
      return data as Appointment[];
    },
    enabled: !!user?.id,
  });

  const weekDays = Array.from({ length: 7 }).map((_, i) =>
    addDays(startOfWeek(selectedDate, { weekStartsOn: 0 }), i)
  );

  const todayAppointments = appointments.filter(
    (apt) => apt.appointment_date === format(selectedDate, 'yyyy-MM-dd')
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Confirmado';
      case 'pending': return 'Pendente';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  // Generate time slots for the day view
  const timeSlots = [];
  for (let hour = 8; hour <= 18; hour++) {
    timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
    timeSlots.push(`${hour.toString().padStart(2, '0')}:30`);
  }

  const getAppointmentForSlot = (time: string) => {
    return todayAppointments.find((apt) => apt.start_time === time);
  };

  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[hsl(var(--avivar-foreground))]">Agenda</h1>
          <p className="text-[hsl(var(--avivar-muted-foreground))]">
            Gerencie seus agendamentos e disponibilidade
          </p>
        </div>
        <Button
          className="bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-accent))] text-white"
          onClick={() => toast.info("Novo agendamento em desenvolvimento")}
        >
          <Plus className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Novo Agendamento</span>
        </Button>
      </div>

      <div className="grid lg:grid-cols-[300px_1fr] gap-6">
        {/* Calendar Sidebar */}
        <div className="space-y-4">
          <Card className="border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-card))]">
            <CardContent className="p-3">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                locale={ptBR}
                className="pointer-events-auto"
              />
            </CardContent>
          </Card>

          {/* View Toggle */}
          <div className="flex border border-[hsl(var(--avivar-border))] rounded-lg p-1 bg-[hsl(var(--avivar-card))]">
            <Button
              variant={view === "day" ? "secondary" : "ghost"}
              className="flex-1"
              onClick={() => setView("day")}
            >
              Dia
            </Button>
            <Button
              variant={view === "week" ? "secondary" : "ghost"}
              className="flex-1"
              onClick={() => setView("week")}
            >
              Semana
            </Button>
          </div>

          {/* Quick Stats */}
          <Card className="border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-card))]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-[hsl(var(--avivar-foreground))]">
                Resumo do Dia
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[hsl(var(--avivar-muted-foreground))]">Agendamentos</span>
                <Badge variant="secondary">{todayAppointments.length}</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[hsl(var(--avivar-muted-foreground))]">Confirmados</span>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  {todayAppointments.filter(a => a.status === 'confirmed').length}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[hsl(var(--avivar-muted-foreground))]">Pendentes</span>
                <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                  {todayAppointments.filter(a => a.status === 'pending').length}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Schedule View */}
        <Card className="border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-card))]">
          <CardHeader className="border-b border-[hsl(var(--avivar-border))]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    setSelectedDate((d) => addDays(d, view === "day" ? -1 : -7))
                  }
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <CardTitle className="text-lg text-[hsl(var(--avivar-foreground))]">
                  {view === "day"
                    ? format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })
                    : `Semana de ${format(weekDays[0], "dd/MM")} a ${format(
                        weekDays[6],
                        "dd/MM"
                      )}`}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    setSelectedDate((d) => addDays(d, view === "day" ? 1 : 7))
                  }
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDate(new Date())}
                className="border-[hsl(var(--avivar-border))]"
              >
                Hoje
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(var(--avivar-primary))]" />
              </div>
            ) : view === "day" ? (
              <div className="space-y-2">
                {timeSlots.map((time) => {
                  const appointment = getAppointmentForSlot(time);
                  
                  return (
                    <div
                      key={time}
                      className={`flex items-center gap-4 p-3 rounded-lg border transition-colors ${
                        appointment
                          ? "border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-primary)/0.05)]"
                          : "border-dashed border-[hsl(var(--avivar-border))] hover:border-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-primary)/0.02)] cursor-pointer"
                      }`}
                      onClick={() =>
                        !appointment &&
                        toast.info(`Agendar horário ${time}`)
                      }
                    >
                      <div className="flex items-center gap-2 w-16 text-sm font-medium text-[hsl(var(--avivar-muted-foreground))]">
                        <Clock className="h-4 w-4" />
                        {time}
                      </div>

                      {appointment ? (
                        <div className="flex-1 flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-[hsl(var(--avivar-primary))]" />
                              <p className="font-medium text-sm text-[hsl(var(--avivar-foreground))]">
                                {appointment.patient_name}
                              </p>
                            </div>
                            <div className="flex items-center gap-4 mt-1">
                              <span className="text-xs text-[hsl(var(--avivar-muted-foreground))] flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {appointment.patient_phone}
                              </span>
                              {appointment.service_type && (
                                <span className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
                                  {appointment.service_type}
                                </span>
                              )}
                            </div>
                          </div>
                          <Badge className={getStatusColor(appointment.status)}>
                            {getStatusLabel(appointment.status)}
                          </Badge>
                        </div>
                      ) : (
                        <div className="flex-1 text-sm text-[hsl(var(--avivar-muted-foreground))]">
                          Horário disponível
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-2">
                {weekDays.map((day, index) => {
                  const dayAppointments = appointments.filter(
                    (apt) => apt.appointment_date === format(day, 'yyyy-MM-dd')
                  );
                  
                  return (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border text-center cursor-pointer transition-colors ${
                        isSameDay(day, selectedDate)
                          ? "border-[hsl(var(--avivar-primary))] bg-[hsl(var(--avivar-primary)/0.1)]"
                          : "border-[hsl(var(--avivar-border))] hover:border-[hsl(var(--avivar-primary)/0.5)]"
                      }`}
                      onClick={() => {
                        setSelectedDate(day);
                        setView("day");
                      }}
                    >
                      <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
                        {format(day, "EEE", { locale: ptBR })}
                      </p>
                      <p className="text-lg font-semibold text-[hsl(var(--avivar-foreground))]">
                        {format(day, "dd")}
                      </p>
                      {dayAppointments.length > 0 && (
                        <Badge variant="secondary" className="text-xs mt-1">
                          {dayAppointments.length} ag.
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
