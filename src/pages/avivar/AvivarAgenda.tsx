/**
 * AvivarAgenda - Página de Agenda do Portal Avivar
 * Gerenciamento de agendamentos com suporte a múltiplas agendas
 */

import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Clock, User, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext";
import { AgendaSelector } from "@/components/avivar/AgendaSelector";
import { AvivarAgenda as AgendaType, useAvivarAgendas } from "@/hooks/useAvivarAgendas";
import { NewAppointmentDialog } from "@/components/avivar/NewAppointmentDialog";

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
  location: string | null;
  professional_name: string | null;
  agenda_id: string | null;
}

export default function AvivarAgenda() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [view, setView] = useState<"day" | "week">("day");
  const [selectedAgenda, setSelectedAgenda] = useState<AgendaType | null>(null);
  const [showNewAppointment, setShowNewAppointment] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | undefined>();
  const { user } = useUnifiedAuth();
  const { agendas } = useAvivarAgendas();

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['avivar-appointments', user?.id, format(selectedDate, 'yyyy-MM-dd'), selectedAgenda?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const startOfWeekDate = startOfWeek(selectedDate, { weekStartsOn: 0 });
      const endOfWeekDate = addDays(startOfWeekDate, 6);
      
      let query = supabase
        .from('avivar_appointments')
        .select('*')
        .eq('user_id', user.id)
        .gte('appointment_date', format(startOfWeekDate, 'yyyy-MM-dd'))
        .lte('appointment_date', format(endOfWeekDate, 'yyyy-MM-dd'))
        .order('appointment_date', { ascending: true })
        .order('start_time', { ascending: true });

      // Filtrar por agenda se selecionada
      if (selectedAgenda) {
        query = query.eq('agenda_id', selectedAgenda.id);
      }

      const { data, error } = await query;

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
      case 'scheduled': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Confirmado';
      case 'pending': return 'Pendente';
      case 'scheduled': return 'Agendado';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const getAgendaColor = (agendaId: string | null) => {
    if (!agendaId) return '#6B7280';
    const agenda = agendas.find(a => a.id === agendaId);
    return agenda?.color || '#6B7280';
  };

  const getAgendaName = (agendaId: string | null) => {
    if (!agendaId) return null;
    const agenda = agendas.find(a => a.id === agendaId);
    return agenda?.name || null;
  };

  // Generate time slots for the day view
  const timeSlots = [];
  for (let hour = 8; hour <= 18; hour++) {
    timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
    timeSlots.push(`${hour.toString().padStart(2, '0')}:30`);
  }

  const getAppointmentForSlot = (time: string) => {
    return todayAppointments.find((apt) => apt.start_time === time || apt.start_time === time + ':00');
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
        <div className="flex items-center gap-3">
          <AgendaSelector 
            selectedAgenda={selectedAgenda} 
            onSelect={setSelectedAgenda} 
          />
          <Button
            className="bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-accent))] text-white"
            onClick={() => {
              setSelectedTimeSlot(undefined);
              setShowNewAppointment(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Novo Agendamento</span>
          </Button>
        </div>
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
                  {todayAppointments.filter(a => a.status === 'pending' || a.status === 'scheduled').length}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Agendas Legend */}
          {agendas.length > 1 && !selectedAgenda && (
            <Card className="border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-card))]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-[hsl(var(--avivar-foreground))]">
                  Agendas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {agendas.map((agenda) => (
                  <button
                    key={agenda.id}
                    className="flex items-center gap-2 w-full p-2 rounded-md hover:bg-muted/50 transition-colors text-left"
                    onClick={() => setSelectedAgenda(agenda)}
                  >
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: agenda.color }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{agenda.name}</p>
                      {agenda.city && (
                        <p className="text-xs text-muted-foreground">{agenda.city}</p>
                      )}
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>
          )}
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
                  const agendaColor = appointment ? getAgendaColor(appointment.agenda_id) : null;
                  
                  return (
                    <div
                      key={time}
                      className={`flex items-center gap-4 p-3 rounded-lg border transition-colors ${
                        appointment
                          ? "border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-primary)/0.05)]"
                          : "border-dashed border-[hsl(var(--avivar-border))] hover:border-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-primary)/0.02)] cursor-pointer"
                      }`}
                      onClick={() => {
                        if (!appointment) {
                          setSelectedTimeSlot(time);
                          setShowNewAppointment(true);
                        }
                      }}
                    >
                      <div className="flex items-center gap-2 w-16 text-sm font-medium text-[hsl(var(--avivar-muted-foreground))]">
                        <Clock className="h-4 w-4" />
                        {time}
                      </div>

                      {appointment ? (
                        <div className="flex-1 flex items-center justify-between">
                          <div className="flex items-start gap-3">
                            {/* Agenda color indicator */}
                            {agendaColor && agendas.length > 1 && !selectedAgenda && (
                              <div 
                                className="w-1 h-full min-h-[40px] rounded-full flex-shrink-0"
                                style={{ backgroundColor: agendaColor }}
                              />
                            )}
                            <div>
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-[hsl(var(--avivar-primary))]" />
                                <p className="font-medium text-sm text-[hsl(var(--avivar-foreground))]">
                                  {appointment.patient_name}
                                </p>
                              </div>
                              <div className="flex items-center gap-4 mt-1 flex-wrap">
                                <span className="text-xs text-[hsl(var(--avivar-muted-foreground))] flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {appointment.patient_phone}
                                </span>
                                {appointment.service_type && (
                                  <span className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
                                    {appointment.service_type}
                                  </span>
                                )}
                                {(appointment.location || getAgendaName(appointment.agenda_id)) && (
                                  <span className="text-xs text-[hsl(var(--avivar-muted-foreground))] flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {appointment.location || getAgendaName(appointment.agenda_id)}
                                  </span>
                                )}
                              </div>
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
                        <div className="mt-1 space-y-1">
                          <Badge variant="secondary" className="text-xs">
                            {dayAppointments.length} ag.
                          </Badge>
                          {/* Show agenda colors if multiple agendas */}
                          {agendas.length > 1 && !selectedAgenda && (
                            <div className="flex justify-center gap-1 flex-wrap">
                              {[...new Set(dayAppointments.map(a => a.agenda_id))].map((agendaId) => (
                                <div 
                                  key={agendaId || 'none'} 
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: getAgendaColor(agendaId) }}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* New Appointment Dialog */}
      <NewAppointmentDialog
        open={showNewAppointment}
        onOpenChange={setShowNewAppointment}
        selectedDate={selectedDate}
        selectedTime={selectedTimeSlot}
        selectedAgenda={selectedAgenda}
      />
    </div>
  );
}
