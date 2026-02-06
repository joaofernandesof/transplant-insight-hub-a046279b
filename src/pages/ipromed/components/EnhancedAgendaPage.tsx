/**
 * IPROMED - Enhanced Agenda with Multiple Views
 * Diário, Semanal, Mensal, Lista e Google Calendar
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Calendar,
  Plus,
  Clock,
  MapPin,
  Video,
  Users,
  Gavel,
  Bell,
  CheckCircle2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  List,
  LayoutGrid,
  ExternalLink,
  Download,
  Tag,
  UserPlus,
  Mail,
  Search,
  HelpCircle,
} from "lucide-react";
import { 
  format, 
  startOfWeek, 
  addDays, 
  isSameDay, 
  parseISO, 
  addWeeks, 
  subWeeks,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  addMonths,
  subMonths,
  startOfDay,
  endOfDay,
  isToday,
  isPast,
  isFuture,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Appointment {
  id: string;
  client_id: string | null;
  case_id: string | null;
  title: string;
  description: string | null;
  appointment_type: string;
  start_datetime: string;
  end_datetime: string | null;
  all_day: boolean;
  location: string | null;
  is_virtual: boolean;
  meeting_url: string | null;
  status: string;
  priority: string;
  created_at: string;
  ipromed_legal_clients?: { name: string } | null;
}

const typeConfig: Record<string, { label: string; icon: React.ElementType; color: string; bgColor: string }> = {
  reuniao: { label: 'Reunião', icon: Users, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  audiencia: { label: 'Audiência', icon: Gavel, color: 'text-purple-600', bgColor: 'bg-purple-100' },
  prazo: { label: 'Prazo', icon: Clock, color: 'text-rose-600', bgColor: 'bg-rose-100' },
  lembrete: { label: 'Lembrete', icon: Bell, color: 'text-amber-600', bgColor: 'bg-amber-100' },
  tarefa: { label: 'Tarefa', icon: CheckCircle2, color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  low: { label: 'Baixa', color: 'bg-gray-100 text-gray-700' },
  normal: { label: 'Normal', color: 'bg-blue-100 text-blue-700' },
  high: { label: 'Alta', color: 'bg-amber-100 text-amber-700' },
  urgent: { label: 'Urgente', color: 'bg-rose-100 text-rose-700' },
};

type ViewMode = 'day' | 'week' | 'month' | 'list';

export default function EnhancedAgendaPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [showGoogleCalendarInfo, setShowGoogleCalendarInfo] = useState(false);
  
  // New Task/Event dialogs
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  
  // Task Form State
  const [taskForm, setTaskForm] = useState({
    description: '',
    date: new Date().toISOString().split('T')[0],
    task_list: '',
    case_id: '',
    responsible: '',
    priority: 'low',
  });
  
  // Event Form State
  const [eventForm, setEventForm] = useState({
    title: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    all_day: true,
    location: '',
    modality: '',
    alert_days: 0,
    alert_unit: 'days',
    responsible: '',
    additional_people: [] as string[],
    external_emails: '',
    observations: '',
    case_id: '',
  });
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    appointment_type: 'reuniao',
    start_date: new Date().toISOString().split('T')[0],
    start_time: '09:00',
    end_time: '10:00',
    all_day: false,
    location: '',
    is_virtual: false,
    meeting_url: '',
    client_id: '',
    priority: 'normal',
  });

  const queryClient = useQueryClient();

  // Calculate date range based on view
  const getDateRange = () => {
    switch (viewMode) {
      case 'day':
        return { start: startOfDay(currentDate), end: endOfDay(currentDate) };
      case 'week':
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
        return { start: weekStart, end: addDays(weekStart, 7) };
      case 'month':
        return { start: startOfMonth(currentDate), end: endOfMonth(currentDate) };
      case 'list':
        return { start: new Date(), end: addMonths(new Date(), 3) };
      default:
        return { start: new Date(), end: addDays(new Date(), 7) };
    }
  };

  const dateRange = getDateRange();

  // Fetch appointments
  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['ipromed-appointments', dateRange.start.toISOString(), dateRange.end.toISOString()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ipromed_appointments')
        .select(`*, ipromed_legal_clients(name)`)
        .gte('start_datetime', dateRange.start.toISOString())
        .lt('start_datetime', dateRange.end.toISOString())
        .order('start_datetime');

      if (error) throw error;
      return data as Appointment[];
    },
  });

  // Fetch clients
  const { data: clients = [] } = useQuery({
    queryKey: ['ipromed-clients-dropdown'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ipromed_legal_clients')
        .select('id, name')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  // Helper to convert local datetime string to proper ISO with timezone offset
  const toLocalISOString = (dateStr: string, timeStr: string = '00:00') => {
    const date = new Date(`${dateStr}T${timeStr}:00`);
    return date.toISOString();
  };

  // Create appointment
  const createAppointment = useMutation({
    mutationFn: async () => {
      const startDateTime = formData.all_day 
        ? toLocalISOString(formData.start_date, '00:00')
        : toLocalISOString(formData.start_date, formData.start_time);
      
      const endDateTime = formData.all_day
        ? null
        : toLocalISOString(formData.start_date, formData.end_time);

      const { error } = await supabase
        .from('ipromed_appointments')
        .insert([{
          title: formData.title,
          description: formData.description || null,
          appointment_type: formData.appointment_type,
          start_datetime: startDateTime,
          end_datetime: endDateTime,
          all_day: formData.all_day,
          location: formData.location || null,
          is_virtual: formData.is_virtual,
          meeting_url: formData.is_virtual ? formData.meeting_url : null,
          client_id: formData.client_id && formData.client_id !== '__none__' ? formData.client_id : null,
          priority: formData.priority,
        }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ipromed-appointments'] });
      toast.success('Compromisso criado!');
      setIsFormOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error('Erro: ' + error.message);
    },
  });

  // Create Task
  const createTask = useMutation({
    mutationFn: async () => {
      const startDateTime = toLocalISOString(taskForm.date, '09:00');
      
      const { error } = await supabase
        .from('ipromed_appointments')
        .insert([{
          title: taskForm.description,
          description: null,
          appointment_type: 'tarefa',
          start_datetime: startDateTime,
          end_datetime: null,
          all_day: true,
          location: null,
          is_virtual: false,
          meeting_url: null,
          case_id: taskForm.case_id && taskForm.case_id !== '__none__' ? taskForm.case_id : null,
          priority: taskForm.priority,
        }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ipromed-appointments'] });
      toast.success('Tarefa criada!');
      setIsTaskDialogOpen(false);
      resetTaskForm();
    },
    onError: (error) => {
      toast.error('Erro: ' + error.message);
    },
  });

  // Create Event
  const createEvent = useMutation({
    mutationFn: async () => {
      const startDateTime = toLocalISOString(eventForm.start_date, '00:00');
      const endDateTime = toLocalISOString(eventForm.end_date, '23:59');
      
      const { error } = await supabase
        .from('ipromed_appointments')
        .insert([{
          title: eventForm.title,
          description: eventForm.observations || null,
          appointment_type: 'reuniao',
          start_datetime: startDateTime,
          end_datetime: endDateTime,
          all_day: eventForm.all_day,
          location: eventForm.location || null,
          is_virtual: eventForm.modality === 'virtual',
          meeting_url: null,
          case_id: eventForm.case_id && eventForm.case_id !== '__none__' ? eventForm.case_id : null,
          priority: 'normal',
        }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ipromed-appointments'] });
      toast.success('Evento criado!');
      setIsEventDialogOpen(false);
      resetEventForm();
    },
    onError: (error) => {
      toast.error('Erro: ' + error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      appointment_type: 'reuniao',
      start_date: new Date().toISOString().split('T')[0],
      start_time: '09:00',
      end_time: '10:00',
      all_day: false,
      location: '',
      is_virtual: false,
      meeting_url: '',
      client_id: '',
      priority: 'normal',
    });
  };

  const resetTaskForm = () => {
    setTaskForm({
      description: '',
      date: new Date().toISOString().split('T')[0],
      task_list: '',
      case_id: '',
      responsible: '',
      priority: 'low',
    });
  };

  const resetEventForm = () => {
    setEventForm({
      title: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date().toISOString().split('T')[0],
      all_day: true,
      location: '',
      modality: '',
      alert_days: 0,
      alert_unit: 'days',
      responsible: '',
      additional_people: [],
      external_emails: '',
      observations: '',
      case_id: '',
    });
  };

  // Navigation
  const navigatePrev = () => {
    switch (viewMode) {
      case 'day': setCurrentDate(addDays(currentDate, -1)); break;
      case 'week': setCurrentDate(subWeeks(currentDate, 1)); break;
      case 'month': setCurrentDate(subMonths(currentDate, 1)); break;
    }
  };

  const navigateNext = () => {
    switch (viewMode) {
      case 'day': setCurrentDate(addDays(currentDate, 1)); break;
      case 'week': setCurrentDate(addWeeks(currentDate, 1)); break;
      case 'month': setCurrentDate(addMonths(currentDate, 1)); break;
    }
  };

  const goToToday = () => setCurrentDate(new Date());

  // Get appointments for a specific day
  const getAppointmentsForDay = (day: Date) => 
    appointments.filter(apt => isSameDay(parseISO(apt.start_datetime), day));

  // Stats
  const stats = {
    total: appointments.length,
    reunioes: appointments.filter(a => a.appointment_type === 'reuniao').length,
    audiencias: appointments.filter(a => a.appointment_type === 'audiencia').length,
    prazos: appointments.filter(a => a.appointment_type === 'prazo').length,
  };

  // Render appointment card
  const renderAppointmentCard = (apt: Appointment, compact = false) => {
    const config = typeConfig[apt.appointment_type] || typeConfig.reuniao;
    const Icon = config.icon;
    const priorityCfg = priorityConfig[apt.priority] || priorityConfig.normal;

    if (compact) {
      return (
        <div 
          key={apt.id} 
          className={`p-2 rounded text-xs ${config.bgColor} border-l-4 ${config.color.replace('text-', 'border-')} mb-1 cursor-pointer hover:opacity-80 transition-opacity`}
        >
          <div className="font-medium truncate">{apt.title}</div>
          {!apt.all_day && (
            <div className="text-[10px] opacity-70">
              {format(parseISO(apt.start_datetime), 'HH:mm')}
            </div>
          )}
        </div>
      );
    }

    return (
      <Card key={apt.id} className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className={`h-10 w-10 rounded-lg ${config.bgColor} flex items-center justify-center`}>
                <Icon className={`h-5 w-5 ${config.color}`} />
              </div>
              <div>
                <h4 className="font-semibold">{apt.title}</h4>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <Clock className="h-3 w-3" />
                  <span>
                    {apt.all_day ? 'Dia inteiro' : format(parseISO(apt.start_datetime), "dd/MM • HH:mm")}
                    {apt.end_datetime && ` - ${format(parseISO(apt.end_datetime), 'HH:mm')}`}
                  </span>
                </div>
                {apt.ipromed_legal_clients?.name && (
                  <div className="text-sm text-muted-foreground mt-1">
                    <Users className="h-3 w-3 inline mr-1" />
                    {apt.ipromed_legal_clients.name}
                  </div>
                )}
                {(apt.location || apt.is_virtual) && (
                  <div className="text-sm text-muted-foreground mt-1">
                    {apt.is_virtual ? (
                      <span className="flex items-center gap-1">
                        <Video className="h-3 w-3" />
                        Reunião Virtual
                        {apt.meeting_url && (
                          <a href={apt.meeting_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {apt.location}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge variant="outline" className={priorityCfg.color}>
                {priorityCfg.label}
              </Badge>
              <Badge variant="outline" className={config.bgColor + ' ' + config.color}>
                {config.label}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Render Daily View
  const renderDayView = () => {
    const dayAppointments = getAppointmentsForDay(currentDate);
    const hours = Array.from({ length: 14 }, (_, i) => i + 7); // 7:00 to 20:00

    return (
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">
            {format(currentDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-1">
            {hours.map(hour => {
              const hourAppointments = dayAppointments.filter(apt => {
                const aptHour = parseISO(apt.start_datetime).getHours();
                return aptHour === hour;
              });
              
              return (
                <div key={hour} className="flex gap-4 py-2 border-b border-border/50">
                  <div className="w-16 text-sm text-muted-foreground font-medium">
                    {hour.toString().padStart(2, '0')}:00
                  </div>
                  <div className="flex-1">
                    {hourAppointments.length > 0 ? (
                      <div className="space-y-1">
                        {hourAppointments.map(apt => renderAppointmentCard(apt, true))}
                      </div>
                    ) : (
                      <div className="h-8 border-l-2 border-dashed border-border/30" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Render Week View
  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="p-0">
          <div className="grid grid-cols-7 divide-x">
            {weekDays.map(day => {
              const dayAppointments = getAppointmentsForDay(day);
              const dayIsToday = isToday(day);
              
              return (
                <div key={day.toISOString()} className="min-h-[300px]">
                  <div className={`p-3 text-center border-b ${dayIsToday ? 'bg-primary/10' : 'bg-muted/50'}`}>
                    <div className="text-xs text-muted-foreground uppercase">
                      {format(day, 'EEE', { locale: ptBR })}
                    </div>
                    <div className={`text-lg font-semibold ${dayIsToday ? 'text-primary' : ''}`}>
                      {format(day, 'd')}
                    </div>
                  </div>
                  <div className="p-2 space-y-1">
                    {dayAppointments.map(apt => renderAppointmentCard(apt, true))}
                    {dayAppointments.length === 0 && (
                      <div className="text-xs text-muted-foreground text-center py-4">
                        Sem compromissos
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Render Month View
  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = addDays(startOfWeek(monthEnd, { weekStartsOn: 1 }), 6);
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }

    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="p-0">
          {/* Header */}
          <div className="grid grid-cols-7 border-b">
            {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground bg-muted/50">
                {day}
              </div>
            ))}
          </div>
          {/* Weeks */}
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 divide-x border-b last:border-b-0">
              {week.map(day => {
                const dayAppointments = getAppointmentsForDay(day);
                const isCurrentMonth = isSameMonth(day, currentDate);
                const dayIsToday = isToday(day);

                return (
                  <div 
                    key={day.toISOString()} 
                    className={`min-h-[100px] p-1 ${!isCurrentMonth ? 'bg-muted/30' : ''} ${dayIsToday ? 'bg-primary/5' : ''}`}
                  >
                    <div className={`text-sm font-medium mb-1 ${dayIsToday ? 'text-primary' : isCurrentMonth ? '' : 'text-muted-foreground'}`}>
                      {format(day, 'd')}
                    </div>
                    <div className="space-y-0.5">
                      {dayAppointments.slice(0, 3).map(apt => {
                        const config = typeConfig[apt.appointment_type] || typeConfig.reuniao;
                        return (
                          <div 
                            key={apt.id}
                            className={`text-[10px] p-1 rounded truncate ${config.bgColor} ${config.color}`}
                          >
                            {apt.title}
                          </div>
                        );
                      })}
                      {dayAppointments.length > 3 && (
                        <div className="text-[10px] text-muted-foreground text-center">
                          +{dayAppointments.length - 3} mais
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </CardContent>
      </Card>
    );
  };

  // Render List View
  const renderListView = () => {
    const sortedAppointments = [...appointments].sort((a, b) => 
      new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime()
    );

    const groupedByDate: Record<string, Appointment[]> = {};
    sortedAppointments.forEach(apt => {
      const dateKey = format(parseISO(apt.start_datetime), 'yyyy-MM-dd');
      if (!groupedByDate[dateKey]) groupedByDate[dateKey] = [];
      groupedByDate[dateKey].push(apt);
    });

    return (
      <div className="space-y-6">
        {Object.entries(groupedByDate).map(([dateKey, dayAppointments]) => {
          const date = parseISO(dateKey);
          const dayIsToday = isToday(date);
          const dayIsPast = isPast(date) && !dayIsToday;

          return (
            <div key={dateKey}>
              <div className={`flex items-center gap-2 mb-3 ${dayIsPast ? 'opacity-60' : ''}`}>
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${dayIsToday ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  <span className="text-lg font-bold">{format(date, 'd')}</span>
                </div>
                <div>
                  <div className="font-semibold">{format(date, "EEEE", { locale: ptBR })}</div>
                  <div className="text-sm text-muted-foreground">
                    {format(date, "dd 'de' MMMM", { locale: ptBR })}
                  </div>
                </div>
                {dayIsToday && <Badge className="ml-2">Hoje</Badge>}
              </div>
              <div className="space-y-3 ml-12">
                {dayAppointments.map(apt => renderAppointmentCard(apt))}
              </div>
            </div>
          );
        })}
        {sortedAppointments.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center text-muted-foreground">
              Nenhum compromisso encontrado no período
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Agenda</h1>
          <p className="text-sm text-muted-foreground">
            Compromissos, audiências e prazos
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Google Calendar Button */}
          <Dialog open={showGoogleCalendarInfo} onOpenChange={setShowGoogleCalendarInfo}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <CalendarDays className="h-4 w-4" />
                Google Agenda
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-primary" />
                  Sincronizar com Google Agenda
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <p className="text-sm text-muted-foreground">
                  A integração com Google Calendar permitirá sincronização automática dos seus compromissos.
                </p>
                
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Funcionalidades planejadas:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Sincronização bidirecional automática</li>
                    <li>Notificações no Google Calendar</li>
                    <li>Compartilhamento de agenda com equipe</li>
                    <li>Integração com Google Meet</li>
                  </ul>
                </div>
                
                <div className="bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 p-4 rounded-lg text-sm border border-amber-200 dark:border-amber-800">
                  <p className="font-medium mb-1">🚧 Em desenvolvimento</p>
                  <p>A API do Google Calendar será integrada em breve. Por enquanto, você pode exportar seus compromissos manualmente.</p>
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    // Export appointments as ICS file
                    const icsContent = appointments.map(apt => {
                      const start = new Date(apt.start_datetime);
                      const end = apt.end_datetime ? new Date(apt.end_datetime) : new Date(start.getTime() + 60*60*1000);
                      const formatICS = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
                      return `BEGIN:VEVENT
DTSTART:${formatICS(start)}
DTEND:${formatICS(end)}
SUMMARY:${apt.title}
DESCRIPTION:${apt.description || ''}
LOCATION:${apt.location || ''}
END:VEVENT`;
                    }).join('\n');
                    
                    const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//IPROMED//Agenda//PT
${icsContent}
END:VCALENDAR`;
                    
                    const blob = new Blob([ics], { type: 'text/calendar' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `agenda-ipromed-${format(new Date(), 'yyyy-MM-dd')}.ics`;
                    link.click();
                    URL.revokeObjectURL(url);
                    
                    toast.success('Agenda exportada!', {
                      description: 'Importe o arquivo .ics no Google Calendar',
                    });
                    setShowGoogleCalendarInfo(false);
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar para Importação Manual (.ics)
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Dropdown + para Tarefa ou Evento */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="gap-2 bg-primary">
                <Plus className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsTaskDialogOpen(true)}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Tarefa
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsEventDialogOpen(true)}>
                <Calendar className="h-4 w-4 mr-2" />
                Evento
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Dialog Nova Tarefa */}
          <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>Adicionar tarefa</span>
                  <Tag className="h-5 w-5 text-muted-foreground" />
                </DialogTitle>
              </DialogHeader>
              <ScrollArea className="max-h-[70vh]">
                <div className="space-y-4 py-4 pr-4">
                  {/* Descrição da tarefa */}
                  <div className="space-y-2">
                    <Label>Descrição da tarefa *</Label>
                    <Textarea
                      value={taskForm.description}
                      onChange={(e) => setTaskForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Digite a descrição da tarefa"
                      className="min-h-[80px]"
                    />
                  </div>

                  {/* Data + Lista de tarefas */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Data</Label>
                      <Input
                        type="date"
                        value={taskForm.date}
                        onChange={(e) => setTaskForm(prev => ({ ...prev, date: e.target.value }))}
                      />
                      <Button variant="link" className="p-0 h-auto text-primary text-sm">
                        + Adicionar recorrência
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <Label>Lista de tarefas *</Label>
                      <Select
                        value={taskForm.task_list}
                        onValueChange={(v) => setTaskForm(prev => ({ ...prev, task_list: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="geral">Geral</SelectItem>
                          <SelectItem value="juridico">Jurídico</SelectItem>
                          <SelectItem value="administrativo">Administrativo</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="link" className="p-0 h-auto text-primary text-sm">
                        Criar nova lista
                      </Button>
                    </div>
                  </div>

                  {/* Processo, caso ou atendimento */}
                  <div className="space-y-2">
                    <Label>Processo, caso ou atendimento</Label>
                    <div className="relative">
                      <Input
                        placeholder="Encontre um processo, caso ou atendimento"
                        value={taskForm.case_id}
                        onChange={(e) => setTaskForm(prev => ({ ...prev, case_id: e.target.value }))}
                      />
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>

                  {/* Responsável + Prioridade */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Responsável *</Label>
                      <div className="relative">
                        <Input
                          value={taskForm.responsible}
                          onChange={(e) => setTaskForm(prev => ({ ...prev, responsible: e.target.value }))}
                          placeholder="Nome do responsável"
                        />
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      </div>
                      <Button variant="link" className="p-0 h-auto text-primary text-sm">
                        Envolver mais pessoas
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <Label>Prioridade *</Label>
                      <Select
                        value={taskForm.priority}
                        onValueChange={(v) => setTaskForm(prev => ({ ...prev, priority: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Baixa</SelectItem>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="high">Alta</SelectItem>
                          <SelectItem value="urgent">Urgente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </ScrollArea>
              <div className="flex justify-end gap-4 pt-4 border-t">
                <Button variant="ghost" onClick={() => setIsTaskDialogOpen(false)}>
                  CANCELAR
                </Button>
                <Button 
                  variant="ghost" 
                  className="text-primary font-semibold"
                  onClick={() => createTask.mutate()}
                  disabled={!taskForm.description || createTask.isPending}
                >
                  {createTask.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  SALVAR
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Dialog Novo Evento */}
          <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Novo Evento</DialogTitle>
              </DialogHeader>
              <ScrollArea className="max-h-[70vh]">
                <div className="space-y-4 py-4 pr-4">
                  {/* Título do evento */}
                  <div className="space-y-2">
                    <Label>Título do evento *</Label>
                    <Input
                      value={eventForm.title}
                      onChange={(e) => setEventForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Digite o título do evento"
                    />
                  </div>

                  {/* De / Até */}
                  <div className="space-y-2">
                    <Label>De *</Label>
                    <Input
                      type="date"
                      value={eventForm.start_date}
                      onChange={(e) => setEventForm(prev => ({ ...prev, start_date: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Até *</Label>
                    <Input
                      type="date"
                      value={eventForm.end_date}
                      onChange={(e) => setEventForm(prev => ({ ...prev, end_date: e.target.value }))}
                    />
                  </div>

                  {/* Dia inteiro + Recorrência */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={eventForm.all_day}
                        onCheckedChange={(v) => setEventForm(prev => ({ ...prev, all_day: !!v }))}
                      />
                      <Label>Dia inteiro</Label>
                    </div>
                  </div>
                  <Button variant="link" className="p-0 h-auto text-primary text-sm">
                    + Adicionar recorrência
                  </Button>

                  {/* Endereço + Modalidade */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Endereço ou local</Label>
                      <Input
                        value={eventForm.location}
                        onChange={(e) => setEventForm(prev => ({ ...prev, location: e.target.value }))}
                        placeholder="Local do evento"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Modalidade</Label>
                      <Select
                        value={eventForm.modality}
                        onValueChange={(v) => setEventForm(prev => ({ ...prev, modality: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="presencial">Presencial</SelectItem>
                          <SelectItem value="virtual">Virtual</SelectItem>
                          <SelectItem value="hibrido">Híbrido</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Alertas internos + Responsável */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1">
                        Alertas internos de antecedência
                        <HelpCircle className="h-3 w-3 text-muted-foreground" />
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          min={0}
                          value={eventForm.alert_days}
                          onChange={(e) => setEventForm(prev => ({ ...prev, alert_days: parseInt(e.target.value) || 0 }))}
                          className="w-16"
                        />
                        <Select
                          value={eventForm.alert_unit}
                          onValueChange={(v) => setEventForm(prev => ({ ...prev, alert_unit: v }))}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="days">Dia(s) antes</SelectItem>
                            <SelectItem value="hours">Hora(s) antes</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Responsável *</Label>
                      <div className="relative">
                        <Input
                          value={eventForm.responsible}
                          onChange={(e) => setEventForm(prev => ({ ...prev, responsible: e.target.value }))}
                          placeholder="Nome do responsável"
                        />
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      </div>
                      <Button variant="link" className="p-0 h-auto text-primary text-sm">
                        + Envolver mais pessoas
                      </Button>
                    </div>
                  </div>

                  {/* Resumo para pessoas externas */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1">
                      Resumo para pessoas externas
                      <HelpCircle className="h-3 w-3 text-muted-foreground" />
                    </Label>
                    <div className="text-sm text-muted-foreground">E-mails externos</div>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Mail className="h-4 w-4" />
                      CONFIGURAR E-MAIL
                    </Button>
                  </div>

                  {/* Observações */}
                  <div className="space-y-2">
                    <Label>Observações</Label>
                    <Textarea
                      value={eventForm.observations}
                      onChange={(e) => setEventForm(prev => ({ ...prev, observations: e.target.value }))}
                      placeholder="Digite observações sobre o evento"
                      className="min-h-[80px]"
                    />
                  </div>

                  {/* Processo, caso ou atendimento */}
                  <div className="space-y-2">
                    <Label>Processo, caso ou atendimento</Label>
                    <div className="relative">
                      <Input
                        placeholder="Encontre um processo, caso ou atendimento"
                        value={eventForm.case_id}
                        onChange={(e) => setEventForm(prev => ({ ...prev, case_id: e.target.value }))}
                      />
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              </ScrollArea>
              <div className="flex justify-end gap-4 pt-4 border-t">
                <Button variant="ghost" onClick={() => setIsEventDialogOpen(false)}>
                  CANCELAR
                </Button>
                <Button 
                  variant="ghost" 
                  className="text-primary font-semibold"
                  onClick={() => createEvent.mutate()}
                  disabled={!eventForm.title || createEvent.isPending}
                >
                  {createEvent.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  SALVAR
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Total</div>
                <div className="text-2xl font-bold">{stats.total}</div>
              </div>
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Reuniões</div>
                <div className="text-2xl font-bold text-blue-600">{stats.reunioes}</div>
              </div>
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Audiências</div>
                <div className="text-2xl font-bold text-purple-600">{stats.audiencias}</div>
              </div>
              <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Gavel className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Prazos</div>
                <div className="text-2xl font-bold text-rose-600">{stats.prazos}</div>
              </div>
              <div className="h-10 w-10 rounded-lg bg-rose-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-rose-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View Tabs and Navigation */}
      <div className="flex items-center justify-between">
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)} className="w-auto">
          <TabsList>
            <TabsTrigger value="day" className="gap-2">
              <CalendarDays className="h-4 w-4" />
              Diário
            </TabsTrigger>
            <TabsTrigger value="week" className="gap-2">
              <LayoutGrid className="h-4 w-4" />
              Semanal
            </TabsTrigger>
            <TabsTrigger value="month" className="gap-2">
              <Calendar className="h-4 w-4" />
              Mensal
            </TabsTrigger>
            <TabsTrigger value="list" className="gap-2">
              <List className="h-4 w-4" />
              Lista
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {viewMode !== 'list' && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={navigatePrev}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday}>
              Hoje
            </Button>
            <span className="text-sm font-medium px-2 min-w-[200px] text-center">
              {viewMode === 'day' && format(currentDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              {viewMode === 'week' && `${format(startOfWeek(currentDate, { weekStartsOn: 1 }), "dd/MM")} - ${format(addDays(startOfWeek(currentDate, { weekStartsOn: 1 }), 6), "dd/MM/yyyy")}`}
              {viewMode === 'month' && format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })}
            </span>
            <Button variant="outline" size="sm" onClick={navigateNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Calendar View */}
      {isLoading ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-8 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : (
        <>
          {viewMode === 'day' && renderDayView()}
          {viewMode === 'week' && renderWeekView()}
          {viewMode === 'month' && renderMonthView()}
          {viewMode === 'list' && renderListView()}
        </>
      )}
    </div>
  );
}
