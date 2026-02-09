/**
 * AvivarAgenda - Página de Agenda do Portal Avivar
 * Gerenciamento de agendamentos com suporte a múltiplas agendas
 * Agora inclui Controle de Calls integrado
 */

import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Plus, Clock, User, Phone, MapPin, Settings, Lock, Calendar as CalendarIcon, CalendarCheck, CalendarX, Search, Filter, RefreshCw, Bell, MessageSquare, MoreVertical, CheckCircle, XCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { format, addDays, startOfWeek, isSameDay, getDay, isToday, isTomorrow, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext";
import { toast } from "sonner";
import { AgendaSelector } from "@/components/avivar/AgendaSelector";
import { AvivarAgenda as AgendaType, useAvivarAgendas } from "@/hooks/useAvivarAgendas";
import { NewAppointmentDialog } from "@/components/avivar/NewAppointmentDialog";
import { EditAppointmentDialog } from "@/components/avivar/EditAppointmentDialog";
import { CreateAvivarAgendaDialog } from "@/components/avivar/CreateAvivarAgendaDialog";
import { useAvivarScheduleConfig, generateTimeSlotsForDay, generateDefaultTimeSlots } from "@/hooks/useAvivarScheduleConfig";

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
  lead_id: string | null;
  cancellation_reason: string | null;
  confirmed_at: string | null;
  cancelled_at: string | null;
  created_at: string;
}

interface AppointmentAlert {
  id: string;
  appointment_id: string;
  type: 'cancellation_intent' | 'reschedule_intent' | 'no_show_risk';
  message: string;
  detected_at: string;
  is_resolved: boolean;
}

const STATUS_CONFIG = {
  confirmed: { 
    label: 'Confirmados', 
    color: 'bg-green-500/20 text-green-600 border-green-500/30',
    icon: CalendarCheck,
  },
  pending: { 
    label: 'Pendentes', 
    color: 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30',
    icon: Clock,
  },
  scheduled: { 
    label: 'Agendados', 
    color: 'bg-blue-500/20 text-blue-600 border-blue-500/30',
    icon: CalendarIcon,
  },
  cancelled: { 
    label: 'Cancelados', 
    color: 'bg-red-500/20 text-red-600 border-red-500/30',
    icon: CalendarX,
  },
  no_show: { 
    label: 'Não Compareceu', 
    color: 'bg-gray-500/20 text-gray-600 border-gray-500/30',
    icon: XCircle,
  },
  completed: { 
    label: 'Realizado', 
    color: 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30',
    icon: CheckCircle,
  },
};

type ControlTabStatus = 'all' | 'confirmed' | 'pending' | 'cancelled' | 'alerts';

export default function AvivarAgenda() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const mainView = searchParams.get('view') === 'control' ? 'control' : 'calendar';
  
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [view, setView] = useState<"day" | "week">("day");
  const [selectedAgenda, setSelectedAgenda] = useState<AgendaType | null>(null);
  const [agendaInitialized, setAgendaInitialized] = useState(false);
  const [showNewAppointment, setShowNewAppointment] = useState(false);
  const [showEditAppointment, setShowEditAppointment] = useState(false);
  const [showCreateAgenda, setShowCreateAgenda] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | undefined>();
  
  // Control view states
  const [controlTab, setControlTab] = useState<ControlTabStatus>('all');
  const [controlSearch, setControlSearch] = useState('');
  const [controlDateFilter, setControlDateFilter] = useState<'today' | 'tomorrow' | 'week' | 'all'>('all');
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  
  const { user } = useUnifiedAuth();
  const { agendas, isLoading: loadingAgendas } = useAvivarAgendas();
  const { scheduleConfig, scheduleHours, isLoading: loadingSchedule } = useAvivarScheduleConfig(selectedAgenda?.id || null);
  const queryClient = useQueryClient();

  // Auto-select first agenda when agendas load (prevent "Todas as agendas" ghost state)
  useEffect(() => {
    if (!agendaInitialized && agendas && agendas.length > 0) {
      setSelectedAgenda(agendas[0]);
      setAgendaInitialized(true);
    }
  }, [agendas, agendaInitialized]);

  // Calendar view appointments (week based)
  const { data: calendarAppointments = [], isLoading: isLoadingCalendar } = useQuery({
    queryKey: ['avivar-appointments', format(selectedDate, 'yyyy-MM-dd'), selectedAgenda?.id],
    queryFn: async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser?.id) return [];
      
      const startOfWeekDate = startOfWeek(selectedDate, { weekStartsOn: 0 });
      const endOfWeekDate = addDays(startOfWeekDate, 6);
      
      let query = supabase
        .from('avivar_appointments')
        .select('*')
        .gte('appointment_date', format(startOfWeekDate, 'yyyy-MM-dd'))
        .lte('appointment_date', format(endOfWeekDate, 'yyyy-MM-dd'))
        .order('appointment_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (selectedAgenda) {
        query = query.eq('agenda_id', selectedAgenda.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Appointment[];
    },
    enabled: !!user?.id && mainView === 'calendar',
  });

  // Control view appointments (all)
  const { data: controlAppointments = [], isLoading: isLoadingControl, refetch: refetchControl } = useQuery({
    queryKey: ['avivar-agenda-control', user?.authUserId],
    queryFn: async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser?.id) return [];

      const { data, error } = await supabase
        .from('avivar_appointments')
        .select('*')
        .order('appointment_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;
      return data as Appointment[];
    },
    enabled: !!user?.authUserId && mainView === 'control',
  });

  // Fetch alerts (simulated)
  const { data: alerts = [] } = useQuery({
    queryKey: ['avivar-agenda-alerts', user?.authUserId],
    queryFn: async () => [] as AppointmentAlert[],
    enabled: !!user?.authUserId && mainView === 'control',
  });

  // Fetch schedule blocks for the selected agenda
  const { data: scheduleBlocks = [] } = useQuery({
    queryKey: ['avivar-schedule-blocks', scheduleConfig?.id, format(selectedDate, 'yyyy-MM-dd')],
    queryFn: async () => {
      if (!scheduleConfig?.id) return [];
      
      const startOfWeekDate = startOfWeek(selectedDate, { weekStartsOn: 0 });
      const endOfWeekDate = addDays(startOfWeekDate, 6);
      
      const { data, error } = await supabase
        .from('avivar_schedule_blocks')
        .select('*')
        .eq('schedule_config_id', scheduleConfig.id)
        .gte('block_date', format(startOfWeekDate, 'yyyy-MM-dd'))
        .lte('block_date', format(endOfWeekDate, 'yyyy-MM-dd'));
      
      if (error) throw error;
      return data;
    },
    enabled: !!scheduleConfig?.id,
  });

  // Confirm appointment mutation
  const confirmMutation = useMutation({
    mutationFn: async (appointmentId: string) => {
      const { error } = await supabase
        .from('avivar_appointments')
        .update({ 
          status: 'confirmed',
          confirmed_at: new Date().toISOString()
        })
        .eq('id', appointmentId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avivar-agenda-control'] });
      queryClient.invalidateQueries({ queryKey: ['avivar-appointments'] });
      toast.success('Agendamento confirmado!');
      setShowConfirmDialog(false);
      setSelectedAppointment(null);
    },
    onError: () => toast.error('Erro ao confirmar agendamento'),
  });

  // Cancel appointment mutation
  const cancelMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { error } = await supabase
        .from('avivar_appointments')
        .update({ 
          status: 'cancelled',
          cancellation_reason: reason,
          cancelled_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avivar-agenda-control'] });
      queryClient.invalidateQueries({ queryKey: ['avivar-appointments'] });
      toast.success('Agendamento cancelado');
      setShowCancelDialog(false);
      setSelectedAppointment(null);
      setCancelReason('');
    },
    onError: () => toast.error('Erro ao cancelar agendamento'),
  });

  const weekDays = Array.from({ length: 7 }).map((_, i) =>
    addDays(startOfWeek(selectedDate, { weekStartsOn: 0 }), i)
  );

  const todayAppointments = calendarAppointments.filter(
    (apt) => apt.appointment_date === format(selectedDate, 'yyyy-MM-dd') && apt.status !== 'cancelled'
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

  // Generate time slots for the day view based on schedule configuration
  const timeSlots = useMemo(() => {
    const dayOfWeek = getDay(selectedDate);
    const consultationDuration = scheduleConfig?.consultation_duration || 30;
    
    if (scheduleHours.length > 0) {
      const slots = generateTimeSlotsForDay(dayOfWeek, scheduleHours, consultationDuration);
      return slots;
    }
    
    return generateDefaultTimeSlots(consultationDuration);
  }, [selectedDate, scheduleHours, scheduleConfig?.consultation_duration]);

  const getAppointmentForSlot = (time: string) => {
    return todayAppointments.find((apt) => apt.start_time === time || apt.start_time === time + ':00');
  };

  // Check if a time slot is blocked
  const isSlotBlocked = (date: Date, time: string): { blocked: boolean; reason?: string } => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const timeWithSeconds = time.length === 5 ? time + ':00' : time;
    
    for (const block of scheduleBlocks) {
      if (block.block_date !== dateStr) continue;
      
      if (!block.start_time || !block.end_time) {
        return { blocked: true, reason: block.reason || 'Bloqueado' };
      }
      
      const blockStart = block.start_time;
      const blockEnd = block.end_time;
      
      if (timeWithSeconds >= blockStart && timeWithSeconds < blockEnd) {
        return { blocked: true, reason: block.reason || 'Bloqueado' };
      }
    }
    
    return { blocked: false };
  };

  // Check if an entire day has any blocks
  const isDayBlocked = (date: Date): { blocked: boolean; reason?: string } => {
    const dateStr = format(date, 'yyyy-MM-dd');
    
    for (const block of scheduleBlocks) {
      if (block.block_date === dateStr) {
        if (!block.start_time || !block.end_time || 
            (block.start_time === '00:00:00' && block.end_time === '23:00:00')) {
          return { blocked: true, reason: block.reason || 'Bloqueado' };
        }
        return { blocked: true, reason: block.reason || 'Parcialmente bloqueado' };
      }
    }
    
    return { blocked: false };
  };

  // Get display name for header
  const getHeaderTitle = () => {
    if (mainView === 'control') return 'Agenda';
    if (selectedAgenda) {
      return selectedAgenda.professional_name || selectedAgenda.name;
    }
    if (agendas.length === 1) {
      return agendas[0].professional_name || agendas[0].name;
    }
    return 'Agenda';
  };

  // Control view filtered appointments
  const filteredControlAppointments = useMemo(() => {
    let filtered = [...controlAppointments];

    const today = new Date();
    if (controlDateFilter === 'today') {
      filtered = filtered.filter(a => a.appointment_date === format(today, 'yyyy-MM-dd'));
    } else if (controlDateFilter === 'tomorrow') {
      filtered = filtered.filter(a => a.appointment_date === format(addDays(today, 1), 'yyyy-MM-dd'));
    } else if (controlDateFilter === 'week') {
      const weekEnd = addDays(today, 7);
      filtered = filtered.filter(a => {
        const date = new Date(a.appointment_date);
        return date >= startOfDay(today) && date <= endOfDay(weekEnd);
      });
    }

    if (controlTab === 'confirmed') {
      filtered = filtered.filter(a => a.status === 'confirmed');
    } else if (controlTab === 'pending') {
      filtered = filtered.filter(a => a.status === 'pending' || a.status === 'scheduled');
    } else if (controlTab === 'cancelled') {
      filtered = filtered.filter(a => a.status === 'cancelled' || a.status === 'no_show');
    }

    if (controlSearch) {
      const searchLower = controlSearch.toLowerCase();
      filtered = filtered.filter(a => 
        a.patient_name.toLowerCase().includes(searchLower) ||
        a.patient_phone.includes(controlSearch) ||
        a.service_type?.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [controlAppointments, controlTab, controlDateFilter, controlSearch]);

  // Control view stats
  const controlStats = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const todayAppts = controlAppointments.filter(a => a.appointment_date === today);
    
    return {
      total: todayAppts.length,
      confirmed: todayAppts.filter(a => a.status === 'confirmed').length,
      pending: todayAppts.filter(a => a.status === 'pending' || a.status === 'scheduled').length,
      cancelled: todayAppts.filter(a => a.status === 'cancelled').length,
      alerts: alerts.filter(a => !a.is_resolved).length,
    };
  }, [controlAppointments, alerts]);

  const getDateLabel = (date: string) => {
    const d = new Date(date + 'T00:00:00');
    if (isToday(d)) return 'Hoje';
    if (isTomorrow(d)) return 'Amanhã';
    return format(d, "EEEE, dd/MM", { locale: ptBR });
  };

  const handleOpenChat = (appointment: Appointment) => {
    if (appointment.patient_phone) {
      navigate(`/avivar/inbox?phone=${encodeURIComponent(appointment.patient_phone)}`);
    }
  };

  const handleOpenLead = (appointment: Appointment) => {
    if (appointment.lead_id) {
      navigate(`/avivar/leads?leadId=${appointment.lead_id}`);
    } else if (appointment.patient_phone) {
      navigate(`/avivar/inbox?phone=${encodeURIComponent(appointment.patient_phone)}`);
    }
  };

  const setMainView = (newView: 'calendar' | 'control') => {
    if (newView === 'control') {
      setSearchParams({ view: 'control' });
    } else {
      setSearchParams({});
    }
  };

  // Empty state - no agendas created yet
  if (!loadingAgendas && agendas.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-6 text-center max-w-md">
          <div className="p-6 rounded-full bg-[hsl(var(--avivar-primary))]/10">
            <CalendarIcon className="h-16 w-16 text-[hsl(var(--avivar-primary))]" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-[hsl(var(--avivar-foreground))]">
              Bem-vindo à sua Agenda
            </h2>
            <p className="text-[hsl(var(--avivar-muted-foreground))] text-sm leading-relaxed">
              Crie sua primeira agenda para começar a gerenciar seus agendamentos, horários e atendimentos.
            </p>
          </div>
          <Button
            onClick={() => setShowCreateAgenda(true)}
            size="lg"
            className="gap-2 bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-primary))]/90 text-[hsl(var(--avivar-primary-foreground))] px-8"
          >
            <Plus className="h-5 w-5" />
            Criar sua primeira agenda
          </Button>
        </div>

        <CreateAvivarAgendaDialog
          open={showCreateAgenda}
          onOpenChange={setShowCreateAgenda}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-[hsl(var(--avivar-foreground))]">
            {getHeaderTitle()}
          </h1>
          {/* Inline agenda selector - only in calendar view */}
          {mainView === 'calendar' && agendas.length > 0 && (
            <AgendaSelector 
              selectedAgenda={selectedAgenda} 
              onSelect={setSelectedAgenda}
              variant="compact"
              hideAllOption
            />
          )}
          {/* View Toggle - Dia/Semana - always visible above calendar */}
          {mainView === 'calendar' && (
            <div className="flex border border-[hsl(var(--avivar-border))] rounded-lg p-1 bg-[hsl(var(--avivar-card))]">
              <Button
                variant={view === "day" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setView("day")}
              >
                Diário
              </Button>
              <Button
                variant={view === "week" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setView("week")}
              >
                Semanal
              </Button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex border border-[hsl(var(--avivar-border))] rounded-lg p-1 bg-[hsl(var(--avivar-card))]">
            <Button
              variant={mainView === "calendar" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setMainView("calendar")}
            >
              <CalendarIcon className="h-4 w-4 mr-1" />
              Calendário
            </Button>
            <Button
              variant={mainView === "control" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setMainView("control")}
            >
              <CalendarCheck className="h-4 w-4 mr-1" />
              Controle
            </Button>
          </div>

          {mainView === 'calendar' && (
            <>
              <Button
                variant="outline"
                onClick={() => setShowCreateAgenda(true)}
                className="border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-muted-foreground))] hover:text-[hsl(var(--avivar-foreground))] hover:bg-[hsl(var(--avivar-muted))]"
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar Agenda
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigate('/avivar/agenda/settings')}
                className="border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-muted-foreground))] hover:text-[hsl(var(--avivar-foreground))] hover:bg-[hsl(var(--avivar-muted))]"
                title="Configurações da Agenda"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </>
          )}

          {mainView === 'control' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchControl()}
              className="border-[hsl(var(--avivar-border))]"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Atualizar
            </Button>
          )}

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

      {/* Calendar View */}
      {mainView === 'calendar' && (
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
              {isLoadingCalendar ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(var(--avivar-primary))]" />
                </div>
              ) : view === "day" ? (
                <div className="space-y-2">
                  {timeSlots.map((time) => {
                    const appointment = getAppointmentForSlot(time);
                    const agendaColor = appointment ? getAgendaColor(appointment.agenda_id) : null;
                    const blockStatus = isSlotBlocked(selectedDate, time);
                    
                    if (blockStatus.blocked && !appointment) {
                      return (
                        <div
                          key={time}
                          className="flex items-center gap-4 p-3 rounded-lg border border-red-500/30 bg-red-500/10 cursor-not-allowed opacity-60"
                        >
                          <div className="flex items-center gap-2 w-16 text-sm font-medium text-red-400">
                            <Lock className="h-4 w-4" />
                            {time}
                          </div>
                          <div className="flex-1 text-sm text-red-400">
                            {blockStatus.reason || 'Bloqueado'}
                          </div>
                        </div>
                      );
                    }
                    
                    return (
                      <div
                        key={time}
                        className={`flex items-center gap-4 p-3 rounded-lg border transition-colors cursor-pointer ${
                          appointment
                            ? "border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-primary)/0.05)] hover:bg-[hsl(var(--avivar-primary)/0.1)]"
                            : "border-dashed border-[hsl(var(--avivar-border))] hover:border-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-primary)/0.02)]"
                        }`}
                        onClick={() => {
                          if (appointment) {
                            setSelectedAppointment(appointment);
                            setShowEditAppointment(true);
                          } else {
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
                    const dayAppointments = calendarAppointments.filter(
                      (apt) => apt.appointment_date === format(day, 'yyyy-MM-dd') && apt.status !== 'cancelled'
                    );
                    const dayBlockStatus = isDayBlocked(day);
                    
                    return (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border text-center cursor-pointer transition-colors ${
                          dayBlockStatus.blocked
                            ? "border-red-500/30 bg-red-500/10 opacity-60"
                            : isSameDay(day, selectedDate)
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
                        <p className={`text-lg font-semibold ${dayBlockStatus.blocked ? 'text-red-400' : 'text-[hsl(var(--avivar-foreground))]'}`}>
                          {format(day, "dd")}
                        </p>
                        {dayBlockStatus.blocked && (
                          <div className="mt-1">
                            <Badge className="text-xs bg-red-500/20 text-red-400 border-red-500/30">
                              <Lock className="h-3 w-3 mr-1" />
                              Bloqueado
                            </Badge>
                          </div>
                        )}
                        {!dayBlockStatus.blocked && dayAppointments.length > 0 && (
                          <div className="mt-1 space-y-1">
                            <Badge variant="secondary" className="text-xs">
                              {dayAppointments.length} ag.
                            </Badge>
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
      )}

      {/* Control View */}
      {mainView === 'control' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-card))]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Hoje</p>
                    <p className="text-2xl font-bold text-[hsl(var(--avivar-foreground))]">{controlStats.total}</p>
                  </div>
                  <CalendarIcon className="h-8 w-8 text-[hsl(var(--avivar-primary))] opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-500/30 bg-green-500/5">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-green-600">Confirmados</p>
                    <p className="text-2xl font-bold text-green-600">{controlStats.confirmed}</p>
                  </div>
                  <CalendarCheck className="h-8 w-8 text-green-600 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-yellow-500/30 bg-yellow-500/5">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-yellow-600">Pendentes</p>
                    <p className="text-2xl font-bold text-yellow-600">{controlStats.pending}</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-600 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-red-500/30 bg-red-500/5">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-red-600">Cancelados</p>
                    <p className="text-2xl font-bold text-red-600">{controlStats.cancelled}</p>
                  </div>
                  <CalendarX className="h-8 w-8 text-red-600 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card className={`border-orange-500/30 ${controlStats.alerts > 0 ? 'bg-orange-500/10 animate-pulse' : 'bg-orange-500/5'}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-orange-600">Alertas</p>
                    <p className="text-2xl font-bold text-orange-600">{controlStats.alerts}</p>
                  </div>
                  <Bell className="h-8 w-8 text-orange-600 opacity-50" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters & Tabs */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" />
                <Input
                  placeholder="Buscar por nome, telefone ou serviço..."
                  value={controlSearch}
                  onChange={(e) => setControlSearch(e.target.value)}
                  className="pl-10 border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-card))]"
                />
              </div>
              
              {/* Date Filter */}
              <Select value={controlDateFilter} onValueChange={(v) => setControlDateFilter(v as any)}>
                <SelectTrigger className="w-40 border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-card))]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os dias</SelectItem>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="tomorrow">Amanhã</SelectItem>
                  <SelectItem value="week">Próximos 7 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tabs */}
            <Tabs value={controlTab} onValueChange={(v) => setControlTab(v as ControlTabStatus)}>
              <TabsList className="bg-[hsl(var(--avivar-card))] border border-[hsl(var(--avivar-border))]">
                <TabsTrigger value="all" className="data-[state=active]:bg-[hsl(var(--avivar-primary))] data-[state=active]:text-white">
                  Todos
                  <Badge variant="secondary" className="ml-2">{controlAppointments.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="confirmed" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
                  <CalendarCheck className="h-4 w-4 mr-1" />
                  Confirmados
                </TabsTrigger>
                <TabsTrigger value="pending" className="data-[state=active]:bg-yellow-600 data-[state=active]:text-white">
                  <Clock className="h-4 w-4 mr-1" />
                  Pendentes
                </TabsTrigger>
                <TabsTrigger value="cancelled" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">
                  <CalendarX className="h-4 w-4 mr-1" />
                  Cancelados
                </TabsTrigger>
                <TabsTrigger value="alerts" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white relative">
                  <Bell className="h-4 w-4 mr-1" />
                  Alertas
                  {controlStats.alerts > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
                      {controlStats.alerts}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value={controlTab} className="mt-4">
                {controlTab === 'alerts' ? (
                  <AlertsPanel alerts={alerts} appointments={controlAppointments} />
                ) : (
                  <AppointmentsList 
                    appointments={filteredControlAppointments}
                    isLoading={isLoadingControl}
                    onConfirm={(apt) => {
                      setSelectedAppointment(apt);
                      setShowConfirmDialog(true);
                    }}
                    onCancel={(apt) => {
                      setSelectedAppointment(apt);
                      setShowCancelDialog(true);
                    }}
                    onOpenChat={handleOpenChat}
                    onOpenLead={handleOpenLead}
                    getDateLabel={getDateLabel}
                  />
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Agendamento</DialogTitle>
            <DialogDescription>
              Confirmar o agendamento de {selectedAppointment?.patient_name}?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="p-4 bg-muted rounded-md space-y-2">
              <p><strong>Paciente:</strong> {selectedAppointment?.patient_name}</p>
              <p><strong>Data:</strong> {selectedAppointment && format(new Date(selectedAppointment.appointment_date + 'T00:00:00'), 'dd/MM/yyyy')}</p>
              <p><strong>Horário:</strong> {selectedAppointment?.start_time}</p>
              <p><strong>Serviço:</strong> {selectedAppointment?.service_type || 'Não especificado'}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => selectedAppointment && confirmMutation.mutate(selectedAppointment.id)}
              disabled={confirmMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar Agendamento</DialogTitle>
            <DialogDescription>
              Informe o motivo do cancelamento
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="p-4 bg-muted rounded-md space-y-2">
              <p><strong>Paciente:</strong> {selectedAppointment?.patient_name}</p>
              <p><strong>Data:</strong> {selectedAppointment && format(new Date(selectedAppointment.appointment_date + 'T00:00:00'), 'dd/MM/yyyy')}</p>
              <p><strong>Horário:</strong> {selectedAppointment?.start_time}</p>
            </div>
            <div className="space-y-2">
              <Label>Motivo do cancelamento</Label>
              <Textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Descreva o motivo..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Voltar
            </Button>
            <Button 
              variant="destructive"
              onClick={() => selectedAppointment && cancelMutation.mutate({ 
                id: selectedAppointment.id, 
                reason: cancelReason 
              })}
              disabled={cancelMutation.isPending}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Cancelar Agendamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Appointment Dialog */}
      <NewAppointmentDialog
        open={showNewAppointment}
        onOpenChange={setShowNewAppointment}
        selectedDate={selectedDate}
        selectedTime={selectedTimeSlot}
        selectedAgenda={selectedAgenda}
      />

      {/* Edit Appointment Dialog */}
      <EditAppointmentDialog
        open={showEditAppointment}
        onOpenChange={setShowEditAppointment}
        appointment={selectedAppointment}
      />

      {/* Create Agenda Dialog */}
      <CreateAvivarAgendaDialog
        open={showCreateAgenda}
        onOpenChange={setShowCreateAgenda}
      />
    </div>
  );
}

// Appointments List Component
function AppointmentsList({ 
  appointments, 
  isLoading,
  onConfirm,
  onCancel,
  onOpenChat,
  onOpenLead,
  getDateLabel,
}: {
  appointments: Appointment[];
  isLoading: boolean;
  onConfirm: (apt: Appointment) => void;
  onCancel: (apt: Appointment) => void;
  onOpenChat: (apt: Appointment) => void;
  onOpenLead: (apt: Appointment) => void;
  getDateLabel: (date: string) => string;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(var(--avivar-primary))]" />
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <Card className="border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-card))]">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <CalendarIcon className="h-12 w-12 text-[hsl(var(--avivar-muted-foreground))] mb-4" />
          <p className="text-[hsl(var(--avivar-muted-foreground))]">Nenhum agendamento encontrado</p>
        </CardContent>
      </Card>
    );
  }

  // Group by date
  const grouped = appointments.reduce((acc, apt) => {
    const date = apt.appointment_date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(apt);
    return acc;
  }, {} as Record<string, Appointment[]>);

  return (
    <ScrollArea className="h-[calc(100vh-450px)]">
      <div className="space-y-6">
        {Object.entries(grouped).map(([date, appts]) => (
          <div key={date}>
            <h3 className="text-sm font-semibold text-[hsl(var(--avivar-foreground))] mb-3 sticky top-0 bg-[hsl(var(--avivar-background))] py-2">
              {getDateLabel(date)}
              <Badge variant="secondary" className="ml-2">{appts.length}</Badge>
            </h3>
            <div className="space-y-2">
              {appts.map((apt) => (
                <AppointmentCard
                  key={apt.id}
                  appointment={apt}
                  onConfirm={() => onConfirm(apt)}
                  onCancel={() => onCancel(apt)}
                  onOpenChat={() => onOpenChat(apt)}
                  onOpenLead={() => onOpenLead(apt)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

// Single Appointment Card
function AppointmentCard({ 
  appointment, 
  onConfirm, 
  onCancel, 
  onOpenChat,
  onOpenLead,
}: {
  appointment: Appointment;
  onConfirm: () => void;
  onCancel: () => void;
  onOpenChat: () => void;
  onOpenLead: () => void;
}) {
  const statusConfig = STATUS_CONFIG[appointment.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
  const StatusIcon = statusConfig.icon;
  const isPending = appointment.status === 'pending' || appointment.status === 'scheduled';

  return (
    <Card className="border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-card))] hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          {/* Time */}
          <div className="flex items-center gap-3 min-w-[80px]">
            <Clock className="h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" />
            <span className="font-mono font-medium text-[hsl(var(--avivar-foreground))]">
              {appointment.start_time.substring(0, 5)}
            </span>
          </div>

          {/* Patient Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-[hsl(var(--avivar-primary))]" />
              <span className="font-medium text-[hsl(var(--avivar-foreground))] truncate">
                {appointment.patient_name}
              </span>
              {appointment.lead_id && (
                <Badge variant="outline" className="text-xs">CRM</Badge>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-[hsl(var(--avivar-muted-foreground))]">
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {appointment.patient_phone}
              </span>
              {appointment.service_type && (
                <span>• {appointment.service_type}</span>
              )}
              {appointment.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {appointment.location}
                </span>
              )}
            </div>
          </div>

          {/* Status Badge */}
          <Badge className={statusConfig.color}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusConfig.label}
          </Badge>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {isPending && (
              <Button
                size="sm"
                variant="ghost"
                className="text-green-600 hover:text-green-700 hover:bg-green-100"
                onClick={onConfirm}
              >
                <CheckCircle className="h-4 w-4" />
              </Button>
            )}
            
            <Button
              size="sm"
              variant="ghost"
              onClick={onOpenChat}
              title="Abrir chat"
            >
              <MessageSquare className="h-4 w-4" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onOpenLead}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ver Lead no CRM
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onOpenChat}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Abrir Conversa
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {isPending && (
                  <DropdownMenuItem onClick={onConfirm} className="text-green-600">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirmar
                  </DropdownMenuItem>
                )}
                {appointment.status !== 'cancelled' && (
                  <DropdownMenuItem onClick={onCancel} className="text-red-600">
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancelar
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Cancellation Reason */}
        {appointment.status === 'cancelled' && appointment.cancellation_reason && (
          <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/10 rounded text-xs text-red-600">
            <strong>Motivo:</strong> {appointment.cancellation_reason}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Alerts Panel
function AlertsPanel({ 
  alerts, 
  appointments 
}: { 
  alerts: AppointmentAlert[]; 
  appointments: Appointment[] 
}) {
  if (alerts.length === 0) {
    return (
      <Card className="border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-card))]">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Bell className="h-12 w-12 text-green-500 mb-4" />
          <p className="text-[hsl(var(--avivar-foreground))] font-medium">Nenhum alerta no momento</p>
          <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">
            Quando a IA detectar intenção de cancelamento ou reagendamento, você verá aqui
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => {
        const appointment = appointments.find(a => a.id === alert.appointment_id);
        
        return (
          <Card key={alert.id} className="border-orange-500/30 bg-orange-500/5">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <Bell className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-[hsl(var(--avivar-foreground))]">
                    {alert.type === 'cancellation_intent' && 'Intenção de Cancelamento Detectada'}
                    {alert.type === 'reschedule_intent' && 'Intenção de Reagendamento Detectada'}
                    {alert.type === 'no_show_risk' && 'Risco de Não Comparecimento'}
                  </p>
                  <p className="text-sm text-[hsl(var(--avivar-muted-foreground))] mt-1">
                    {alert.message}
                  </p>
                  {appointment && (
                    <div className="mt-2 p-2 bg-white/50 dark:bg-black/20 rounded text-sm">
                      <strong>{appointment.patient_name}</strong> - {format(new Date(appointment.appointment_date + 'T00:00:00'), 'dd/MM')} às {appointment.start_time.substring(0, 5)}
                    </div>
                  )}
                </div>
                <Button size="sm" variant="outline">
                  Verificar
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
