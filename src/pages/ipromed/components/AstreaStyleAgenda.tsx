/**
 * CPG Advocacia Médica - Agenda Estilo Astrea
 * Calendário mensal com sidebar de detalhes do dia selecionado
 */

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
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
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Plus,
  Clock,
  Users,
  Gavel,
  Bell,
  CheckCircle2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Tag,
  Search,
  RefreshCw,
  MoreVertical,
  Check,
  Palette,
  Settings2,
} from "lucide-react";
import {
  format,
  startOfWeek,
  addDays,
  isSameDay,
  parseISO,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  addMonths,
  subMonths,
  isToday,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

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
  // Deadline check fields
  doc_elaborated: boolean;
  doc_delivered: boolean;
  prazo_done: boolean;
  prazo_filed: boolean;
}

// Meeting type configurations with friendly colors
const typeConfig: Record<string, { 
  label: string; 
  icon: React.ElementType; 
  color: string; 
  bgColor: string; 
  borderColor: string;
  calendarBg: string;
  calendarText: string;
}> = {
  reuniao: { 
    label: 'EVENTO', 
    icon: Users, 
    color: 'text-sky-700', 
    bgColor: 'bg-sky-50', 
    borderColor: 'border-l-sky-500',
    calendarBg: 'bg-sky-100/80',
    calendarText: 'text-sky-700',
  },
  audiencia: { 
    label: 'EVENTO', 
    icon: Gavel, 
    color: 'text-violet-700', 
    bgColor: 'bg-violet-50', 
    borderColor: 'border-l-violet-500',
    calendarBg: 'bg-violet-100/80',
    calendarText: 'text-violet-700',
  },
  prazo: { 
    label: 'TAREFA', 
    icon: Clock, 
    color: 'text-rose-700', 
    bgColor: 'bg-rose-50', 
    borderColor: 'border-l-rose-500',
    calendarBg: 'bg-rose-100/80',
    calendarText: 'text-rose-700',
  },
  lembrete: { 
    label: 'TAREFA', 
    icon: Bell, 
    color: 'text-amber-700', 
    bgColor: 'bg-amber-50', 
    borderColor: 'border-l-amber-500',
    calendarBg: 'bg-amber-100/80',
    calendarText: 'text-amber-700',
  },
  tarefa: { 
    label: 'TAREFA', 
    icon: CheckCircle2, 
    color: 'text-emerald-700', 
    bgColor: 'bg-emerald-50', 
    borderColor: 'border-l-emerald-500',
    calendarBg: 'bg-emerald-100/80',
    calendarText: 'text-emerald-700',
  },
  onboarding: { 
    label: 'ONBOARDING', 
    icon: Users, 
    color: 'text-teal-700', 
    bgColor: 'bg-teal-50', 
    borderColor: 'border-l-teal-500',
    calendarBg: 'bg-teal-100/80',
    calendarText: 'text-teal-700',
  },
  apresentacao: { 
    label: 'APRESENTAÇÃO', 
    icon: Users, 
    color: 'text-indigo-700', 
    bgColor: 'bg-indigo-50', 
    borderColor: 'border-l-indigo-500',
    calendarBg: 'bg-indigo-100/80',
    calendarText: 'text-indigo-700',
  },
  acompanhamento: { 
    label: 'ACOMPANHAMENTO', 
    icon: Users, 
    color: 'text-cyan-700', 
    bgColor: 'bg-cyan-50', 
    borderColor: 'border-l-cyan-500',
    calendarBg: 'bg-cyan-100/80',
    calendarText: 'text-cyan-700',
  },
};

export default function AstreaStyleAgenda() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [assigneeFilter, setAssigneeFilter] = useState('mine');
  const [activityFilter, setActivityFilter] = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingAppointmentId, setEditingAppointmentId] = useState<string | null>(null);
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

  // Calculate date range for month view
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  // Fetch appointments for the visible range (extended for calendar)
  const { data: appointments = [], isLoading, refetch } = useQuery({
    queryKey: ['ipromed-appointments-astrea', monthStart.toISOString()],
    queryFn: async () => {
      const startRange = subMonths(monthStart, 1);
      const endRange = addMonths(monthEnd, 1);

      // Fetch regular appointments
      const { data: regularAppointments, error: regularError } = await supabase
        .from('ipromed_appointments')
        .select(`*, ipromed_legal_clients(name)`)
        .gte('start_datetime', startRange.toISOString())
        .lt('start_datetime', endRange.toISOString())
        .order('start_datetime');

      if (regularError) throw regularError;

      // Also fetch client meetings (from MeetingScheduleDialog)
      const { data: clientMeetings, error: meetingsError } = await supabase
        .from('ipromed_client_meetings')
        .select(`*, ipromed_legal_clients(name)`)
        .gte('scheduled_date', startRange.toISOString().split('T')[0])
        .lte('scheduled_date', endRange.toISOString().split('T')[0])
        .order('scheduled_date');

      if (meetingsError) throw meetingsError;

      // Transform client meetings to match appointment format
      const transformedMeetings: Appointment[] = ((clientMeetings as any[]) || []).map((meeting: any) => ({
        id: meeting.id,
        client_id: meeting.client_id,
        case_id: null,
        title: meeting.title || 'Reunião',
        description: meeting.description,
        appointment_type: 'reuniao',
        start_datetime: `${meeting.scheduled_date}T${meeting.scheduled_time || '09:00'}:00`,
        end_datetime: meeting.duration_minutes 
          ? (() => {
              const [hours, minutes] = (meeting.scheduled_time || '09:00').split(':').map(Number);
              const endDate = new Date(`${meeting.scheduled_date}T${meeting.scheduled_time || '09:00'}:00`);
              endDate.setMinutes(endDate.getMinutes() + meeting.duration_minutes);
              return endDate.toISOString();
            })()
          : null,
        all_day: false,
        location: meeting.location,
        is_virtual: meeting.modality === 'virtual',
        meeting_url: meeting.meeting_link,
        status: meeting.status === 'scheduled' ? 'scheduled' : meeting.status,
        priority: 'normal',
        created_at: meeting.created_at,
        ipromed_legal_clients: meeting.ipromed_legal_clients,
        doc_elaborated: false,
        doc_delivered: false,
        prazo_done: false,
        prazo_filed: false,
      }));

      // Combine and sort all appointments
      const allAppointments = [...(regularAppointments || []), ...transformedMeetings];
      allAppointments.sort((a, b) => 
        new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime()
      );

      return allAppointments as Appointment[];
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

  // Create appointment
  // Helper to convert local datetime string to proper ISO with timezone offset
  const toLocalISOString = (dateStr: string, timeStr: string = '00:00') => {
    const date = new Date(`${dateStr}T${timeStr}:00`);
    return date.toISOString();
  };

  const createAppointment = useMutation({
    mutationFn: async () => {
      // Convert to proper ISO format with timezone
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
      queryClient.invalidateQueries({ queryKey: ['ipromed-appointments-astrea'] });
      toast.success('Compromisso criado!');
      setIsFormOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error('Erro: ' + error.message);
    },
  });

  // Update appointment
  const updateAppointment = useMutation({
    mutationFn: async () => {
      if (!editingAppointmentId) throw new Error('Nenhum compromisso selecionado');

      // Convert to proper ISO format with timezone
      const startDateTime = formData.all_day
        ? toLocalISOString(formData.start_date, '00:00')
        : toLocalISOString(formData.start_date, formData.start_time);

      const endDateTime = formData.all_day
        ? null
        : toLocalISOString(formData.start_date, formData.end_time);

      const { error } = await supabase
        .from('ipromed_appointments')
        .update({
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
        })
        .eq('id', editingAppointmentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ipromed-appointments-astrea'] });
      queryClient.invalidateQueries({ queryKey: ['workspace-agenda-unified'] });
      toast.success('Compromisso atualizado!');
      setIsFormOpen(false);
      setIsEditMode(false);
      setEditingAppointmentId(null);
      resetForm();
    },
    onError: (error) => {
      toast.error('Erro: ' + error.message);
    },
  });

  // Toggle deadline check field
  const toggleDeadlineCheck = useMutation({
    mutationFn: async ({ id, field, value }: { id: string; field: string; value: boolean }) => {
      const { error } = await (supabase as any)
        .from('ipromed_appointments')
        .update({ [field]: value })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ipromed-appointments-astrea'] });
    },
    onError: (error) => {
      toast.error('Erro ao atualizar: ' + error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      appointment_type: 'reuniao',
      start_date: selectedDate.toISOString().split('T')[0],
      start_time: '09:00',
      end_time: '10:00',
      all_day: false,
      location: '',
      is_virtual: false,
      meeting_url: '',
      client_id: '',
      priority: 'normal',
    });
    setIsEditMode(false);
    setEditingAppointmentId(null);
  };

  // Open edit mode with appointment data
  const openEditForm = (apt: Appointment) => {
    const startDate = parseISO(apt.start_datetime);
    const endDate = apt.end_datetime ? parseISO(apt.end_datetime) : null;

    setFormData({
      title: apt.title,
      description: apt.description || '',
      appointment_type: apt.appointment_type,
      start_date: format(startDate, 'yyyy-MM-dd'),
      start_time: format(startDate, 'HH:mm'),
      end_time: endDate ? format(endDate, 'HH:mm') : '10:00',
      all_day: apt.all_day,
      location: apt.location || '',
      is_virtual: apt.is_virtual,
      meeting_url: apt.meeting_url || '',
      client_id: apt.client_id || '',
      priority: apt.priority,
    });

    setEditingAppointmentId(apt.id);
    setIsEditMode(true);
    setIsDetailOpen(false);
    setIsFormOpen(true);
  };

  // Get appointments for a specific day
  const getAppointmentsForDay = (day: Date) =>
    appointments.filter((apt) => isSameDay(parseISO(apt.start_datetime), day));

  // Selected day appointments
  const selectedDayAppointments = useMemo(
    () => getAppointmentsForDay(selectedDate),
    [appointments, selectedDate]
  );

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
    const endDate = addDays(startOfWeek(monthEnd, { weekStartsOn: 0 }), 6);
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentDate]);

  // Group calendar days into weeks
  const weeks = useMemo(() => {
    const result = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
      result.push(calendarDays.slice(i, i + 7));
    }
    return result;
  }, [calendarDays]);

  const navigatePrev = () => setCurrentDate(subMonths(currentDate, 1));
  const navigateNext = () => setCurrentDate(addMonths(currentDate, 1));
  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
  };

  const openNewEventForm = () => {
    setFormData(prev => ({
      ...prev,
      start_date: selectedDate.toISOString().split('T')[0],
    }));
    setIsFormOpen(true);
  };

  const openEventDetail = (apt: Appointment, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedAppointment(apt);
    setIsDetailOpen(true);
  };

  // Render event in calendar cell - with friendly rounded cards
  const renderCalendarEvent = (apt: Appointment) => {
    const config = typeConfig[apt.appointment_type] || typeConfig.reuniao;
    const time = !apt.all_day ? format(parseISO(apt.start_datetime), 'HH:mm') : null;

    return (
      <div
        key={apt.id}
        className={`text-[11px] px-2 py-1 rounded-lg truncate mb-1 border-l-3 ${config.calendarBg} ${config.borderColor} cursor-pointer hover:shadow-sm hover:scale-[1.02] transition-all duration-150`}
        title={apt.title}
        onClick={(e) => openEventDetail(apt, e)}
      >
        <div className="flex items-center gap-1">
          {time && <span className={`font-semibold ${config.calendarText}`}>{time}</span>}
          <span className={`truncate font-medium ${config.calendarText}`}>{apt.title}</span>
        </div>
      </div>
    );
  };

  // Render sidebar event card - with friendly rounded design
  const renderSidebarEvent = (apt: Appointment) => {
    const config = typeConfig[apt.appointment_type] || typeConfig.reuniao;
    const isCompleted = apt.status === 'completed';
    const IconComponent = config.icon;

    return (
      <div 
        key={apt.id} 
        className={`border-l-4 ${config.borderColor} ${config.bgColor} rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer`}
        onClick={(e) => openEventDetail(apt, e)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Icon Badge */}
            <div className={`p-2 rounded-lg ${config.bgColor} border ${config.borderColor.replace('border-l-', 'border-')}`}>
              <IconComponent className={`h-4 w-4 ${config.color}`} />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {isCompleted && (
                  <Check className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                )}
                <span className={`text-xs font-semibold uppercase tracking-wide ${config.color}`}>
                  {config.label}
                </span>
                {apt.priority === 'urgent' && (
                  <Badge className="bg-rose-500 text-white text-[10px] px-1.5 py-0 h-4">
                    Urgente
                  </Badge>
                )}
              </div>
              <h4 className="font-semibold text-sm text-foreground mb-1 line-clamp-2">{apt.title}</h4>
              {!apt.all_day && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {format(parseISO(apt.start_datetime), 'HH:mm')}
                  {apt.end_datetime && ` às ${format(parseISO(apt.end_datetime), 'HH:mm')}`}
                </p>
              )}
              {apt.ipromed_legal_clients?.name && (
                <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {apt.ipromed_legal_clients.name}
                </p>
              )}
              {/* Deadline checks for prazo-type */}
              {apt.appointment_type === 'prazo' && (
                <div className="mt-2 space-y-1" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`doc-elab-${apt.id}`}
                      checked={apt.doc_elaborated}
                      onCheckedChange={(checked) => toggleDeadlineCheck.mutate({ id: apt.id, field: 'doc_elaborated', value: !!checked })}
                      className="h-3.5 w-3.5"
                    />
                    <label htmlFor={`doc-elab-${apt.id}`} className={`text-[11px] cursor-pointer ${apt.doc_elaborated ? 'line-through text-muted-foreground' : ''}`}>
                      Documentação elaborada
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`doc-del-${apt.id}`}
                      checked={apt.doc_delivered}
                      onCheckedChange={(checked) => toggleDeadlineCheck.mutate({ id: apt.id, field: 'doc_delivered', value: !!checked })}
                      className="h-3.5 w-3.5"
                    />
                    <label htmlFor={`doc-del-${apt.id}`} className={`text-[11px] cursor-pointer ${apt.doc_delivered ? 'line-through text-muted-foreground' : ''}`}>
                      Entregue ao cliente
                    </label>
                  </div>
                  {apt.title.toLowerCase().includes('peti') && (
                    <>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`prazo-done-${apt.id}`}
                          checked={apt.prazo_done}
                          onCheckedChange={(checked) => toggleDeadlineCheck.mutate({ id: apt.id, field: 'prazo_done', value: !!checked })}
                          className="h-3.5 w-3.5"
                        />
                        <label htmlFor={`prazo-done-${apt.id}`} className={`text-[11px] cursor-pointer ${apt.prazo_done ? 'line-through text-muted-foreground' : ''}`}>
                          Prazo feito
                        </label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`prazo-filed-${apt.id}`}
                          checked={apt.prazo_filed}
                          onCheckedChange={(checked) => toggleDeadlineCheck.mutate({ id: apt.id, field: 'prazo_filed', value: !!checked })}
                          className="h-3.5 w-3.5"
                        />
                        <label htmlFor={`prazo-filed-${apt.id}`} className={`text-[11px] cursor-pointer ${apt.prazo_filed ? 'line-through text-muted-foreground' : ''}`}>
                          Prazo protocolado
                        </label>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 rounded-full">
              IS
            </Badge>
            {apt.ipromed_legal_clients && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 rounded-full">
                +2
              </Badge>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Agenda</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
          <Button className="gap-2 bg-primary" onClick={openNewEventForm}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Select value={viewMode} onValueChange={(v) => setViewMode(v as 'month' | 'week')}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Por mês" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Por semana</SelectItem>
            <SelectItem value="month">Por mês</SelectItem>
          </SelectContent>
        </Select>

        <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Minhas atribuições" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mine">Minhas atribuições</SelectItem>
            <SelectItem value="all">Todas atribuições</SelectItem>
            <SelectItem value="team">Da equipe</SelectItem>
          </SelectContent>
        </Select>

        <Select value={activityFilter} onValueChange={setActivityFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Todas as atividades" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as atividades</SelectItem>
            <SelectItem value="reuniao">Reuniões</SelectItem>
            <SelectItem value="audiencia">Audiências</SelectItem>
            <SelectItem value="prazo">Prazos</SelectItem>
            <SelectItem value="tarefa">Tarefas</SelectItem>
          </SelectContent>
        </Select>

        {/* Color Legend Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Palette className="h-4 w-4" />
              Cores
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72" align="start">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm">Legenda de Cores</h4>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <Settings2 className="h-3 w-3" />
                </Button>
              </div>
              <div className="space-y-2">
                {Object.entries(typeConfig).map(([key, config]) => (
                  <div 
                    key={key} 
                    className={`flex items-center gap-3 p-2 rounded-lg ${config.bgColor}`}
                  >
                    <div className={`w-3 h-3 rounded-full ${config.borderColor.replace('border-l-', 'bg-')}`} />
                    <config.icon className={`h-4 w-4 ${config.color}`} />
                    <span className={`text-sm font-medium capitalize ${config.color}`}>
                      {key === 'reuniao' ? 'Reunião' :
                       key === 'audiencia' ? 'Audiência' :
                       key === 'prazo' ? 'Prazo' :
                       key === 'lembrete' ? 'Lembrete' :
                       key === 'tarefa' ? 'Tarefa' :
                       key === 'onboarding' ? 'Onboarding' :
                       key === 'apresentacao' ? 'Apresentação' :
                       key === 'acompanhamento' ? 'Acompanhamento' : key}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Button variant="outline" size="icon">
          <Tag className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon">
          <Search className="h-4 w-4" />
        </Button>
      </div>

      {/* Main Content - Calendar + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Calendar */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold capitalize">
                  {format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })}
                </h2>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={goToToday}>
                  HOJE
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={navigatePrev}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={navigateNext}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {/* Week Days Header */}
            <div className="grid grid-cols-7 border-b">
              {['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'].map((day) => (
                <div key={day} className="py-2 text-center text-xs font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="divide-y">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="grid grid-cols-7 divide-x">
                  {week.map((day) => {
                    const dayAppointments = getAppointmentsForDay(day);
                    const isCurrentMonth = isSameMonth(day, currentDate);
                    const dayIsToday = isToday(day);
                    const isSelected = isSameDay(day, selectedDate);
                    const maxVisible = 3;

                    return (
                      <div
                        key={day.toISOString()}
                        className={`min-h-[100px] p-1 cursor-pointer transition-colors
                          ${!isCurrentMonth ? 'bg-muted/30' : 'hover:bg-muted/20'}
                          ${isSelected ? 'bg-primary/5 ring-1 ring-primary/30' : ''}
                        `}
                        onClick={() => handleDayClick(day)}
                      >
                        <div className={`text-sm font-medium mb-1 w-7 h-7 flex items-center justify-center rounded-full
                          ${dayIsToday ? 'bg-primary text-primary-foreground' : ''}
                          ${!isCurrentMonth ? 'text-muted-foreground' : ''}
                        `}>
                          {format(day, 'd')}
                        </div>
                        <div className="space-y-0.5">
                          {dayAppointments.slice(0, maxVisible).map(renderCalendarEvent)}
                          {dayAppointments.length > maxVisible && (
                            <div className="text-[10px] text-muted-foreground text-center">
                              mais {dayAppointments.length - maxVisible}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sidebar - Day Details */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold capitalize">
              {format(selectedDate, "EEE, d MMM yyyy", { locale: ptBR })}
            </h3>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground">
              {selectedDayAppointments.length} atividade{selectedDayAppointments.length !== 1 ? 's' : ''}
            </span>
          </div>

          <ScrollArea className="h-[calc(100vh-340px)]">
            <div className="space-y-3 pr-4">
              {selectedDayAppointments.length > 0 ? (
                selectedDayAppointments.map(renderSidebarEvent)
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">Nenhuma atividade neste dia</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={openNewEventForm}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar atividade
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* New/Edit Event Dialog */}
      <Dialog open={isFormOpen} onOpenChange={(open) => {
        setIsFormOpen(open);
        if (!open) {
          resetForm();
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Editar Compromisso' : 'Novo Compromisso'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Título</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Título do compromisso"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo</Label>
                <Select
                  value={formData.appointment_type}
                  onValueChange={(v) => setFormData({ ...formData, appointment_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reuniao">Reunião</SelectItem>
                    <SelectItem value="audiencia">Audiência</SelectItem>
                    <SelectItem value="prazo">Prazo</SelectItem>
                    <SelectItem value="tarefa">Tarefa</SelectItem>
                    <SelectItem value="lembrete">Lembrete</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Prioridade</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(v) => setFormData({ ...formData, priority: v })}
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

            <div>
              <Label>Data</Label>
              <Input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="allDay"
                checked={formData.all_day}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, all_day: checked as boolean })
                }
              />
              <Label htmlFor="allDay" className="cursor-pointer">
                Dia inteiro
              </Label>
            </div>

            {!formData.all_day && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Início</Label>
                  <Input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Fim</Label>
                  <Input
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  />
                </div>
              </div>
            )}

            <div>
              <Label>Cliente (opcional)</Label>
              <Select
                value={formData.client_id}
                onValueChange={(v) => setFormData({ ...formData, client_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Nenhum</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Descrição</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detalhes do compromisso"
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setIsFormOpen(false)}>
                Cancelar
              </Button>
              <Button
                className="flex-1"
                onClick={() => isEditMode ? updateAppointment.mutate() : createAppointment.mutate()}
                disabled={!formData.title || createAppointment.isPending || updateAppointment.isPending}
              >
                {(createAppointment.isPending || updateAppointment.isPending) ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  isEditMode ? 'Atualizar' : 'Salvar'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Event Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-lg">
          {selectedAppointment && (() => {
            const config = typeConfig[selectedAppointment.appointment_type] || typeConfig.reuniao;
            const IconComponent = config.icon;
            
            return (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg ${config.bgColor} border ${config.borderColor.replace('border-l-', 'border-')}`}>
                      <IconComponent className={`h-5 w-5 ${config.color}`} />
                    </div>
                    <div>
                      <DialogTitle className="text-lg">{selectedAppointment.title}</DialogTitle>
                      <p className={`text-sm font-medium ${config.color}`}>{config.label}</p>
                    </div>
                  </div>
                </DialogHeader>
                
                <div className="space-y-4 pt-4">
                  {/* Date & Time */}
                  <div className="flex items-center gap-3 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        {format(parseISO(selectedAppointment.start_datetime), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </p>
                      {!selectedAppointment.all_day && (
                        <p className="text-muted-foreground">
                          {format(parseISO(selectedAppointment.start_datetime), 'HH:mm')}
                          {selectedAppointment.end_datetime && ` às ${format(parseISO(selectedAppointment.end_datetime), 'HH:mm')}`}
                        </p>
                      )}
                      {selectedAppointment.all_day && (
                        <p className="text-muted-foreground">Dia inteiro</p>
                      )}
                    </div>
                  </div>

                  {/* Client */}
                  {selectedAppointment.ipromed_legal_clients?.name && (
                    <div className="flex items-center gap-3 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Cliente</p>
                        <p className="text-muted-foreground">{selectedAppointment.ipromed_legal_clients.name}</p>
                      </div>
                    </div>
                  )}

                  {/* Location */}
                  {selectedAppointment.location && (
                    <div className="flex items-center gap-3 text-sm">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Local</p>
                        <p className="text-muted-foreground">{selectedAppointment.location}</p>
                      </div>
                    </div>
                  )}

                  {/* Virtual Meeting URL */}
                  {selectedAppointment.is_virtual && selectedAppointment.meeting_url && (
                    <div className="flex items-center gap-3 text-sm">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Link da reunião</p>
                        <a 
                          href={selectedAppointment.meeting_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {selectedAppointment.meeting_url}
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  {selectedAppointment.description && (
                    <div className="pt-2 border-t">
                      <p className="text-sm font-medium mb-1">Descrição</p>
                      <p className="text-sm text-muted-foreground">{selectedAppointment.description}</p>
                    </div>
                  )}

                  {/* Deadline Checks for prazo-type */}
                  {selectedAppointment.appointment_type === 'prazo' && (
                    <div className="pt-3 border-t space-y-3">
                      <p className="text-sm font-medium">Checklist do Prazo</p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id="detail-doc-elab"
                            checked={selectedAppointment.doc_elaborated}
                            onCheckedChange={(checked) => {
                              toggleDeadlineCheck.mutate({ id: selectedAppointment.id, field: 'doc_elaborated', value: !!checked });
                              setSelectedAppointment({ ...selectedAppointment, doc_elaborated: !!checked });
                            }}
                          />
                          <Label htmlFor="detail-doc-elab" className={`cursor-pointer ${selectedAppointment.doc_elaborated ? 'line-through text-muted-foreground' : ''}`}>
                            Documentação elaborada
                          </Label>
                        </div>
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id="detail-doc-del"
                            checked={selectedAppointment.doc_delivered}
                            onCheckedChange={(checked) => {
                              toggleDeadlineCheck.mutate({ id: selectedAppointment.id, field: 'doc_delivered', value: !!checked });
                              setSelectedAppointment({ ...selectedAppointment, doc_delivered: !!checked });
                            }}
                          />
                          <Label htmlFor="detail-doc-del" className={`cursor-pointer ${selectedAppointment.doc_delivered ? 'line-through text-muted-foreground' : ''}`}>
                            Documentação entregue ao cliente
                          </Label>
                        </div>
                        {selectedAppointment.title.toLowerCase().includes('peti') && (
                          <>
                            <div className="flex items-center gap-3">
                              <Checkbox
                                id="detail-prazo-done"
                                checked={selectedAppointment.prazo_done}
                                onCheckedChange={(checked) => {
                                  toggleDeadlineCheck.mutate({ id: selectedAppointment.id, field: 'prazo_done', value: !!checked });
                                  setSelectedAppointment({ ...selectedAppointment, prazo_done: !!checked });
                                }}
                              />
                              <Label htmlFor="detail-prazo-done" className={`cursor-pointer ${selectedAppointment.prazo_done ? 'line-through text-muted-foreground' : ''}`}>
                                Prazo feito
                              </Label>
                            </div>
                            <div className="flex items-center gap-3">
                              <Checkbox
                                id="detail-prazo-filed"
                                checked={selectedAppointment.prazo_filed}
                                onCheckedChange={(checked) => {
                                  toggleDeadlineCheck.mutate({ id: selectedAppointment.id, field: 'prazo_filed', value: !!checked });
                                  setSelectedAppointment({ ...selectedAppointment, prazo_filed: !!checked });
                                }}
                              />
                              <Label htmlFor="detail-prazo-filed" className={`cursor-pointer ${selectedAppointment.prazo_filed ? 'line-through text-muted-foreground' : ''}`}>
                                Prazo protocolado
                              </Label>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Status */}
                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Status:</span>
                      <Badge variant={selectedAppointment.status === 'completed' ? 'default' : 'secondary'}>
                        {selectedAppointment.status === 'completed' ? 'Concluído' : 
                         selectedAppointment.status === 'cancelled' ? 'Cancelado' : 
                         selectedAppointment.status === 'scheduled' ? 'Agendado' : 'Pendente'}
                      </Badge>
                    </div>
                    {selectedAppointment.priority === 'urgent' && (
                      <Badge variant="destructive">Urgente</Badge>
                    )}
                    {selectedAppointment.priority === 'high' && (
                      <Badge variant="outline" className="border-amber-500 text-amber-700">Alta</Badge>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button variant="outline" className="flex-1" onClick={() => setIsDetailOpen(false)}>
                    Fechar
                  </Button>
                  <Button 
                    className="flex-1" 
                    onClick={() => openEditForm(selectedAppointment)}
                  >
                    Editar
                  </Button>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
