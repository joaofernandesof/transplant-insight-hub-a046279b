/**
 * AvivarAgendaControl - Controle de Agendamentos para SDR/Closer
 * Visualização por status com integração ao CRM
 */

import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format, isToday, isTomorrow, isPast, addDays, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext";
import { toast } from "sonner";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Calendar,
  CalendarCheck,
  CalendarX,
  Clock,
  Phone,
  User,
  MessageSquare,
  MoreVertical,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  Bell,
  TrendingUp,
  TrendingDown,
  MapPin,
} from "lucide-react";

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
  conversation_id?: string;
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
    icon: Calendar,
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

type TabStatus = 'all' | 'confirmed' | 'pending' | 'cancelled' | 'alerts';

export default function AvivarAgendaControl() {
  const navigate = useNavigate();
  const { user } = useUnifiedAuth();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState<TabStatus>('all');
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState<'today' | 'tomorrow' | 'week' | 'all'>('all');
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // Fetch appointments
  const { data: appointments = [], isLoading, refetch } = useQuery({
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
    enabled: !!user?.authUserId,
  });

  // Fetch alerts (simulated - would come from AI detection)
  const { data: alerts = [] } = useQuery({
    queryKey: ['avivar-agenda-alerts', user?.authUserId],
    queryFn: async () => {
      // TODO: Implementar busca real de alertas da IA
      // Por enquanto retorna array vazio
      return [] as AppointmentAlert[];
    },
    enabled: !!user?.authUserId,
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
      toast.success('Agendamento cancelado');
      setShowCancelDialog(false);
      setSelectedAppointment(null);
      setCancelReason('');
    },
    onError: () => toast.error('Erro ao cancelar agendamento'),
  });

  // Filter appointments
  const filteredAppointments = useMemo(() => {
    let filtered = [...appointments];

    // Filter by date
    const today = new Date();
    if (dateFilter === 'today') {
      filtered = filtered.filter(a => a.appointment_date === format(today, 'yyyy-MM-dd'));
    } else if (dateFilter === 'tomorrow') {
      filtered = filtered.filter(a => a.appointment_date === format(addDays(today, 1), 'yyyy-MM-dd'));
    } else if (dateFilter === 'week') {
      const weekEnd = addDays(today, 7);
      filtered = filtered.filter(a => {
        const date = new Date(a.appointment_date);
        return date >= startOfDay(today) && date <= endOfDay(weekEnd);
      });
    }

    // Filter by tab/status
    if (activeTab === 'confirmed') {
      filtered = filtered.filter(a => a.status === 'confirmed');
    } else if (activeTab === 'pending') {
      filtered = filtered.filter(a => a.status === 'pending' || a.status === 'scheduled');
    } else if (activeTab === 'cancelled') {
      filtered = filtered.filter(a => a.status === 'cancelled' || a.status === 'no_show');
    }

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(a => 
        a.patient_name.toLowerCase().includes(searchLower) ||
        a.patient_phone.includes(search) ||
        a.service_type?.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [appointments, activeTab, dateFilter, search]);

  // Stats
  const stats = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const todayAppts = appointments.filter(a => a.appointment_date === today);
    
    return {
      total: todayAppts.length,
      confirmed: todayAppts.filter(a => a.status === 'confirmed').length,
      pending: todayAppts.filter(a => a.status === 'pending' || a.status === 'scheduled').length,
      cancelled: todayAppts.filter(a => a.status === 'cancelled').length,
      alerts: alerts.filter(a => !a.is_resolved).length,
    };
  }, [appointments, alerts]);

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

  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[hsl(var(--avivar-foreground))] flex items-center gap-2">
            <Calendar className="h-6 w-6 text-[hsl(var(--avivar-primary))]" />
            Controle de Agendamentos
          </h1>
          <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">
            Gerencie confirmações, pendências e cancelamentos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="border-[hsl(var(--avivar-border))]"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Atualizar
          </Button>
          <Button
            onClick={() => navigate('/avivar/agenda')}
            className="bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-accent))]"
          >
            <Calendar className="h-4 w-4 mr-1" />
            Ver Calendário
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-card))]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Hoje</p>
                <p className="text-2xl font-bold text-[hsl(var(--avivar-foreground))]">{stats.total}</p>
              </div>
              <Calendar className="h-8 w-8 text-[hsl(var(--avivar-primary))] opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-green-600">Confirmados</p>
                <p className="text-2xl font-bold text-green-600">{stats.confirmed}</p>
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
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
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
                <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
              </div>
              <CalendarX className="h-8 w-8 text-red-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className={`border-orange-500/30 ${stats.alerts > 0 ? 'bg-orange-500/10 animate-pulse' : 'bg-orange-500/5'}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-orange-600">Alertas</p>
                <p className="text-2xl font-bold text-orange-600">{stats.alerts}</p>
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
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-card))]"
            />
          </div>
          
          {/* Date Filter */}
          <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as any)}>
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
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabStatus)}>
          <TabsList className="bg-[hsl(var(--avivar-card))] border border-[hsl(var(--avivar-border))]">
            <TabsTrigger value="all" className="data-[state=active]:bg-[hsl(var(--avivar-primary))] data-[state=active]:text-white">
              Todos
              <Badge variant="secondary" className="ml-2">{appointments.length}</Badge>
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
              {stats.alerts > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
                  {stats.alerts}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Content for all tabs */}
          <TabsContent value={activeTab} className="mt-4">
            {activeTab === 'alerts' ? (
              <AlertsPanel alerts={alerts} appointments={appointments} />
            ) : (
              <AppointmentsList 
                appointments={filteredAppointments}
                isLoading={isLoading}
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
          <Calendar className="h-12 w-12 text-[hsl(var(--avivar-muted-foreground))] mb-4" />
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
                <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
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
