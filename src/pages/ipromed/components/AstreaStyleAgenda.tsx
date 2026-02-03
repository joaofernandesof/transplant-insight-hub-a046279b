/**
 * IPROMED - Agenda Estilo Astrea
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
}

const typeConfig: Record<string, { label: string; icon: React.ElementType; color: string; bgColor: string; borderColor: string }> = {
  reuniao: { label: 'EVENTO', icon: Users, color: 'text-blue-700', bgColor: 'bg-blue-50', borderColor: 'border-l-blue-500' },
  audiencia: { label: 'EVENTO', icon: Gavel, color: 'text-purple-700', bgColor: 'bg-purple-50', borderColor: 'border-l-purple-500' },
  prazo: { label: 'TAREFA', icon: Clock, color: 'text-rose-700', bgColor: 'bg-rose-50', borderColor: 'border-l-rose-500' },
  lembrete: { label: 'TAREFA', icon: Bell, color: 'text-amber-700', bgColor: 'bg-amber-50', borderColor: 'border-l-amber-500' },
  tarefa: { label: 'TAREFA', icon: CheckCircle2, color: 'text-emerald-700', bgColor: 'bg-emerald-50', borderColor: 'border-l-emerald-500' },
};

export default function AstreaStyleAgenda() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [assigneeFilter, setAssigneeFilter] = useState('mine');
  const [activityFilter, setActivityFilter] = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
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

      const { data, error } = await supabase
        .from('ipromed_appointments')
        .select(`*, ipromed_legal_clients(name)`)
        .gte('start_datetime', startRange.toISOString())
        .lt('start_datetime', endRange.toISOString())
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

  // Create appointment
  const createAppointment = useMutation({
    mutationFn: async () => {
      const startDateTime = formData.all_day
        ? `${formData.start_date}T00:00:00`
        : `${formData.start_date}T${formData.start_time}:00`;

      const endDateTime = formData.all_day
        ? null
        : `${formData.start_date}T${formData.end_time}:00`;

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

  // Render event in calendar cell
  const renderCalendarEvent = (apt: Appointment) => {
    const config = typeConfig[apt.appointment_type] || typeConfig.reuniao;
    const time = !apt.all_day ? format(parseISO(apt.start_datetime), 'HH:mm') : null;

    return (
      <div
        key={apt.id}
        className={`text-[10px] px-1.5 py-0.5 rounded truncate mb-0.5 border-l-2 ${config.bgColor} ${config.borderColor} cursor-pointer hover:opacity-80`}
        title={apt.title}
      >
        {time && <span className="font-medium text-rose-600 mr-1">{time}</span>}
        <span className="truncate">{apt.title}</span>
      </div>
    );
  };

  // Render sidebar event card
  const renderSidebarEvent = (apt: Appointment) => {
    const config = typeConfig[apt.appointment_type] || typeConfig.reuniao;
    const isCompleted = apt.status === 'completed';

    return (
      <div key={apt.id} className={`border-l-4 ${config.borderColor} bg-card rounded-lg p-4 shadow-sm`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {isCompleted && (
                <Check className="h-4 w-4 text-emerald-600" />
              )}
              <span className={`text-xs font-medium ${config.color}`}>
                {config.label}
                {apt.priority === 'urgent' && (
                  <span className="ml-1 text-rose-600">●</span>
                )}
              </span>
            </div>
            <h4 className="font-medium text-sm mb-1">{apt.title}</h4>
            {!apt.all_day && (
              <p className="text-xs text-muted-foreground">
                {format(parseISO(apt.start_datetime), 'HH:mm')}
                {apt.end_datetime && ` às ${format(parseISO(apt.end_datetime), 'HH:mm')}`}
              </p>
            )}
            {apt.ipromed_legal_clients?.name && (
              <p className="text-xs text-muted-foreground mt-1">
                {apt.ipromed_legal_clients.name}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">
              IS
            </Badge>
            {apt.ipromed_legal_clients && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">
                +2
              </Badge>
            )}
          </div>
        </div>

        {/* Tags for tasks */}
        {apt.appointment_type === 'tarefa' && (
          <div className="flex gap-1 mt-2 flex-wrap">
            <Badge className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 hover:bg-red-600">
              P/PROTOCOLAR ×
            </Badge>
            <Badge className="bg-rose-400 text-white text-[10px] px-1.5 py-0.5 hover:bg-rose-500">
              RECEBIDA ×
            </Badge>
          </div>
        )}
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

      {/* New Event Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo Compromisso</DialogTitle>
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
                onClick={() => createAppointment.mutate()}
                disabled={!formData.title || createAppointment.isPending}
              >
                {createAppointment.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Salvar'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
