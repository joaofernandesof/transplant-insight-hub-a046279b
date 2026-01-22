import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO, isAfter, isBefore, startOfToday, isToday as isDateToday, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { 
  Calendar, Clock, Plus, Loader2, CalendarX, 
  CheckCircle2, XCircle, AlertCircle, LayoutList, GitBranch
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { toast } from 'sonner';

interface Appointment {
  id: string;
  scheduled_at: string;
  status: string;
  notes: string | null;
  appointment_type: string;
  duration_minutes: number | null;
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ElementType }> = {
  scheduled: { label: 'Agendado', variant: 'secondary', icon: Clock },
  confirmed: { label: 'Confirmado', variant: 'default', icon: CheckCircle2 },
  cancelled: { label: 'Cancelado', variant: 'destructive', icon: XCircle },
  completed: { label: 'Realizado', variant: 'outline', icon: CheckCircle2 },
  no_show: { label: 'Não compareceu', variant: 'destructive', icon: AlertCircle },
};

export default function NeoCareAppointments() {
  const navigate = useNavigate();
  const { user } = useUnifiedAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list');

  useEffect(() => {
    if (user) {
      fetchAppointments();
    }
  }, [user]);

  const fetchAppointments = async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    const { data: portalUser } = await supabase
      .from('portal_users')
      .select('id')
      .eq('email', user.email)
      .single();

    if (!portalUser) {
      setIsLoading(false);
      return;
    }

    const { data: patient } = await supabase
      .from('portal_patients')
      .select('id')
      .eq('portal_user_id', portalUser.id)
      .single();

    if (!patient) {
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('portal_appointments')
      .select('id, scheduled_at, status, notes, appointment_type, duration_minutes')
      .eq('patient_id', patient.id)
      .order('scheduled_at', { ascending: true });

    if (error) {
      console.error('Error fetching appointments:', error);
      toast.error('Erro ao carregar agendamentos');
    } else {
      setAppointments(data || []);
    }
    
    setIsLoading(false);
  };

  const handleCancelAppointment = async () => {
    if (!appointmentToCancel) return;

    setIsCancelling(true);
    
    const { error } = await supabase
      .from('portal_appointments')
      .update({ status: 'cancelled' })
      .eq('id', appointmentToCancel);

    setIsCancelling(false);
    setCancelDialogOpen(false);
    setAppointmentToCancel(null);

    if (error) {
      console.error('Error cancelling appointment:', error);
      toast.error('Erro ao cancelar agendamento');
    } else {
      toast.success('Agendamento cancelado com sucesso');
      fetchAppointments();
    }
  };

  const today = startOfToday();
  
  // Filter: upcoming excludes cancelled
  const upcomingAppointments = appointments.filter(
    apt => (isAfter(parseISO(apt.scheduled_at), today) || 
           format(parseISO(apt.scheduled_at), 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) 
           && apt.status !== 'cancelled'
  );
  
  // Past appointments (history) - includes cancelled
  const pastAppointments = appointments.filter(
    apt => (isBefore(parseISO(apt.scheduled_at), today) && 
           format(parseISO(apt.scheduled_at), 'yyyy-MM-dd') !== format(today, 'yyyy-MM-dd'))
           || apt.status === 'cancelled'
  );

  // Group appointments by date for timeline view
  const getTimelineData = (appointmentsList: Appointment[]) => {
    const grouped: Record<string, Appointment[]> = {};
    appointmentsList.forEach(apt => {
      const dateKey = format(parseISO(apt.scheduled_at), 'yyyy-MM-dd');
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(apt);
    });
    return Object.entries(grouped)
      .map(([date, apts]) => ({ date, appointments: apts }))
      .sort((a, b) => a.date.localeCompare(b.date));
  };

  const AppointmentCard = ({ appointment, isPast = false }: { appointment: Appointment; isPast?: boolean }) => {
    const status = statusConfig[appointment.status] || statusConfig.scheduled;
    const StatusIcon = status.icon;
    const canCancel = !isPast && ['scheduled', 'confirmed'].includes(appointment.status);
    const scheduledDate = parseISO(appointment.scheduled_at);
    const isCancelled = appointment.status === 'cancelled';

    return (
      <Card className={cn("transition-all", (isPast || isCancelled) && "opacity-50")}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-4">
              <div className={cn(
                "w-1 rounded-full self-stretch",
                isCancelled ? "bg-destructive/50" : "bg-primary"
              )} />
              <div className="space-y-1">
                <p className={cn("font-medium", isCancelled && "line-through text-muted-foreground")}>
                  {appointment.appointment_type}
                </p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {format(scheduledDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{format(scheduledDate, "HH:mm")}</span>
                  {appointment.duration_minutes && (
                    <span className="text-xs">({appointment.duration_minutes} min)</span>
                  )}
                </div>
                {appointment.notes && (
                  <p className="text-sm text-muted-foreground mt-2">
                    <span className="font-medium">Obs:</span> {appointment.notes}
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge variant={status.variant} className="gap-1">
                <StatusIcon className="h-3 w-3" />
                {status.label}
              </Badge>
              {canCancel && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => {
                    setAppointmentToCancel(appointment.id);
                    setCancelDialogOpen(true);
                  }}
                >
                  Cancelar
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const TimelineView = ({ appointmentsList, isPast = false }: { appointmentsList: Appointment[]; isPast?: boolean }) => {
    const timelineData = getTimelineData(appointmentsList);

    if (timelineData.length === 0) {
      return <EmptyState message={isPast ? "Nenhum histórico de consultas" : "Você não tem consultas agendadas"} />;
    }

    return (
      <div className="space-y-0 relative">
        {/* Vertical line */}
        <div className="absolute left-[19px] top-6 bottom-6 w-0.5 bg-border" />
        
        {timelineData.map(({ date, appointments: dayAppointments }) => {
          const realDate = parseISO(date);
          const isDayToday = isDateToday(realDate);
          
          return (
            <div key={date} className="relative pl-12 pb-6">
              {/* Timeline dot */}
              <div className={cn(
                "absolute left-3 top-1 w-4 h-4 rounded-full border-2 bg-background z-10",
                isDayToday 
                  ? "border-emerald-500 ring-4 ring-emerald-100 dark:ring-emerald-900" 
                  : "border-muted-foreground"
              )} />
              
              {/* Day header */}
              <div className="flex items-center gap-2 mb-3">
                <Badge variant={isDayToday ? "default" : "outline"} className={cn(
                  "font-semibold",
                  isDayToday && "bg-emerald-500"
                )}>
                  {format(realDate, "dd/MM")}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {format(realDate, "EEEE", { locale: ptBR })}
                </span>
                {isDayToday && (
                  <Badge variant="secondary" className="text-[10px]">HOJE</Badge>
                )}
              </div>
              
              {/* Appointments */}
              <div className="space-y-2">
                {dayAppointments.map(apt => {
                  const status = statusConfig[apt.status] || statusConfig.scheduled;
                  const StatusIcon = status.icon;
                  const scheduledDate = parseISO(apt.scheduled_at);
                  const isCancelled = apt.status === 'cancelled';
                  const canCancel = !isPast && ['scheduled', 'confirmed'].includes(apt.status);
                  
                  return (
                    <div
                      key={apt.id}
                      className={cn(
                        "flex items-center justify-between gap-3 p-3 rounded-lg border bg-card",
                        isCancelled && "opacity-50"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                          isCancelled 
                            ? "bg-destructive/10 text-destructive" 
                            : "bg-primary/10 text-primary"
                        )}>
                          <Clock className="h-5 w-5" />
                        </div>
                        <div>
                          <p className={cn(
                            "font-medium text-sm",
                            isCancelled && "line-through text-muted-foreground"
                          )}>
                            {apt.appointment_type}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(scheduledDate, "HH:mm")}
                            {apt.duration_minutes && ` • ${apt.duration_minutes} min`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={status.variant} className="gap-1 text-xs">
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </Badge>
                        {canCancel && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-destructive hover:text-destructive h-8 px-2"
                            onClick={() => {
                              setAppointmentToCancel(apt.id);
                              setCancelDialogOpen(true);
                            }}
                          >
                            Cancelar
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const EmptyState = ({ message }: { message: string }) => (
    <div className="text-center py-12 text-muted-foreground">
      <CalendarX className="h-16 w-16 mx-auto mb-4 opacity-50" />
      <p className="text-lg mb-4">{message}</p>
      <Button onClick={() => navigate('/neocare/appointments/new')}>
        <Plus className="h-4 w-4 mr-2" />
        Agendar Consulta
      </Button>
    </div>
  );

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Meus Agendamentos</h1>
          <p className="text-muted-foreground">Gerencie suas consultas e procedimentos</p>
        </div>
        <Button onClick={() => navigate('/neocare/appointments/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Agendamento
        </Button>
      </div>

      {/* View Toggle */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Visualização:</span>
        <div className="flex border rounded-lg overflow-hidden">
          <Button 
            variant={viewMode === 'list' ? 'default' : 'ghost'} 
            size="sm" 
            className="rounded-none gap-1.5"
            onClick={() => setViewMode('list')}
          >
            <LayoutList className="h-4 w-4" />
            Lista
          </Button>
          <Button 
            variant={viewMode === 'timeline' ? 'default' : 'ghost'} 
            size="sm" 
            className="rounded-none gap-1.5"
            onClick={() => setViewMode('timeline')}
          >
            <GitBranch className="h-4 w-4" />
            Timeline
          </Button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Tabs defaultValue="upcoming" className="space-y-4">
          <TabsList>
            <TabsTrigger value="upcoming" className="gap-2">
              <Clock className="h-4 w-4" />
              Próximos ({upcomingAppointments.length})
            </TabsTrigger>
            <TabsTrigger value="past" className="gap-2">
              <Calendar className="h-4 w-4" />
              Histórico ({pastAppointments.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-4">
            {viewMode === 'list' ? (
              upcomingAppointments.length === 0 ? (
                <EmptyState message="Você não tem consultas agendadas" />
              ) : (
                upcomingAppointments.map(apt => (
                  <AppointmentCard key={apt.id} appointment={apt} />
                ))
              )
            ) : (
              <TimelineView appointmentsList={upcomingAppointments} />
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-4">
            {viewMode === 'list' ? (
              pastAppointments.length === 0 ? (
                <EmptyState message="Nenhum histórico de consultas" />
              ) : (
                pastAppointments.map(apt => (
                  <AppointmentCard key={apt.id} appointment={apt} isPast />
                ))
              )
            ) : (
              <TimelineView appointmentsList={pastAppointments} isPast />
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Cancel Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Agendamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar este agendamento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>Não, manter</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleCancelAppointment}
              disabled={isCancelling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isCancelling ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Cancelando...
                </>
              ) : (
                'Sim, cancelar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
