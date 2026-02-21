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
  Cake,
  Stethoscope,
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

interface ChecklistItem {
  key: string;
  label: string;
}

interface DeadlineType {
  id: string;
  name: string;
  checklist_items: ChecklistItem[];
  is_default: boolean;
}

interface AppointmentCheck {
  id: string;
  appointment_id: string;
  check_key: string;
  check_label: string;
  is_checked: boolean;
  order_index: number;
}

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
  deadline_type_id: string | null;
  // Legacy fields (kept for compatibility)
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
  aniversario: { 
    label: '🎂 ANIVERSÁRIO', 
    icon: Cake, 
    color: 'text-pink-700', 
    bgColor: 'bg-pink-50', 
    borderColor: 'border-l-pink-500',
    calendarBg: 'bg-pink-100/80',
    calendarText: 'text-pink-700',
  },
  dia_especialidade: { 
    label: '⚕️ ESPECIALIDADE', 
    icon: Stethoscope, 
    color: 'text-emerald-700', 
    bgColor: 'bg-emerald-50', 
    borderColor: 'border-l-emerald-500',
    calendarBg: 'bg-emerald-100/80',
    calendarText: 'text-emerald-700',
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
  const [isNewDeadlineTypeOpen, setIsNewDeadlineTypeOpen] = useState(false);
  const [newDeadlineTypeName, setNewDeadlineTypeName] = useState('');
  const [newDeadlineTypeItems, setNewDeadlineTypeItems] = useState<{key: string; label: string}[]>([]);
  const [newItemLabel, setNewItemLabel] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    appointment_type: 'reuniao',
    deadline_type_id: '',
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

      // Also fetch client meetings, clients with birth dates, and specialty days
      const [meetingsRes, clientsBirthRes, specialtyDaysRes] = await Promise.all([
        supabase
          .from('ipromed_client_meetings')
          .select(`*, ipromed_legal_clients(name)`)
          .gte('scheduled_date', startRange.toISOString().split('T')[0])
          .lte('scheduled_date', endRange.toISOString().split('T')[0])
          .order('scheduled_date'),
        supabase
          .from('ipromed_legal_clients')
          .select('id, name, medical_specialty, birth_date')
          .or('birth_date.not.is.null,medical_specialty.not.is.null'),
        supabase
          .from('ipromed_specialty_days')
          .select('specialty, celebration_date, description'),
      ]);

      if (meetingsRes.error) throw meetingsRes.error;

      // Transform client meetings to match appointment format
      const transformedMeetings: Appointment[] = ((meetingsRes.data as any[]) || []).map((meeting: any) => ({
        id: meeting.id,
        client_id: meeting.client_id,
        case_id: null,
        title: meeting.title || 'Reunião',
        description: meeting.description,
        appointment_type: 'reuniao',
        start_datetime: `${meeting.scheduled_date}T${meeting.scheduled_time || '09:00'}:00`,
        end_datetime: meeting.duration_minutes 
          ? (() => {
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
        deadline_type_id: null,
        doc_elaborated: false,
        doc_delivered: false,
        prazo_done: false,
        prazo_filed: false,
      }));

      // Generate birthday events for visible month range
      const birthdayEvents: Appointment[] = [];
      const specialtyEvents: Appointment[] = [];
      const clients = clientsBirthRes.data || [];
      const specialtyDays = specialtyDaysRes.data || [];
      const specialtyMap = new Map(specialtyDays.map(s => [s.specialty, s]));
      
      const daysInRange = eachDayOfInterval({ start: startRange, end: endRange });
      
      for (const client of clients) {
        if (client.birth_date) {
          const birthMMDD = client.birth_date.substring(5); // MM-DD
          for (const day of daysInRange) {
            if (format(day, 'MM-dd') === birthMMDD) {
              const dateStr = format(day, 'yyyy-MM-dd');
              birthdayEvents.push({
                id: `birthday-${client.id}-${dateStr}`,
                client_id: client.id,
                case_id: null,
                title: `🎂 Aniversário: ${client.name}`,
                description: `Parabéns para ${client.name}!`,
                appointment_type: 'aniversario',
                start_datetime: `${dateStr}T08:00:00`,
                end_datetime: null,
                all_day: true,
                location: null,
                is_virtual: false,
                meeting_url: null,
                status: 'confirmed',
                priority: 'normal',
                created_at: new Date().toISOString(),
                ipromed_legal_clients: { name: client.name },
                deadline_type_id: null,
                doc_elaborated: false,
                doc_delivered: false,
                prazo_done: false,
                prazo_filed: false,
              });
            }
          }
        }

        if (client.medical_specialty) {
          const specDay = specialtyMap.get(client.medical_specialty);
          if (specDay) {
            for (const day of daysInRange) {
              if (format(day, 'MM-dd') === specDay.celebration_date) {
                const dateStr = format(day, 'yyyy-MM-dd');
                specialtyEvents.push({
                  id: `specialty-${client.id}-${dateStr}`,
                  client_id: client.id,
                  case_id: null,
                  title: `⚕️ ${specDay.description}: ${client.name}`,
                  description: `Hoje é o ${specDay.description}! Parabenize ${client.name}.`,
                  appointment_type: 'dia_especialidade',
                  start_datetime: `${dateStr}T08:00:00`,
                  end_datetime: null,
                  all_day: true,
                  location: null,
                  is_virtual: false,
                  meeting_url: null,
                  status: 'confirmed',
                  priority: 'normal',
                  created_at: new Date().toISOString(),
                  ipromed_legal_clients: { name: client.name },
                  deadline_type_id: null,
                  doc_elaborated: false,
                  doc_delivered: false,
                  prazo_done: false,
                  prazo_filed: false,
                });
              }
            }
          }
        }
      }

      // Combine and sort all appointments
      const allAppointments = [
        ...(regularAppointments || []), 
        ...transformedMeetings,
        ...birthdayEvents,
        ...specialtyEvents,
      ];
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

  // Fetch deadline types
  const { data: deadlineTypes = [] } = useQuery({
    queryKey: ['ipromed-deadline-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ipromed_deadline_types')
        .select('*')
        .order('is_default', { ascending: false });
      if (error) throw error;
      return data as unknown as DeadlineType[];
    },
  });

  // Fetch appointment checks for all visible appointments
  const appointmentIds = appointments.map(a => a.id);
  const { data: allAppointmentChecks = [] } = useQuery({
    queryKey: ['ipromed-appointment-checks', appointmentIds.join(',')],
    queryFn: async () => {
      if (appointmentIds.length === 0) return [];
      const { data, error } = await supabase
        .from('ipromed_appointment_checks')
        .select('*')
        .in('appointment_id', appointmentIds)
        .order('order_index');
      if (error) throw error;
      return data as AppointmentCheck[];
    },
    enabled: appointmentIds.length > 0,
  });

  // Group checks by appointment id
  const checksByAppointment = useMemo(() => {
    const map: Record<string, AppointmentCheck[]> = {};
    allAppointmentChecks.forEach(c => {
      if (!map[c.appointment_id]) map[c.appointment_id] = [];
      map[c.appointment_id].push(c);
    });
    return map;
  }, [allAppointmentChecks]);

  // Create appointment
  // Helper to convert local datetime string to proper ISO with timezone offset
  const toLocalISOString = (dateStr: string, timeStr: string = '00:00') => {
    const date = new Date(`${dateStr}T${timeStr}:00`);
    return date.toISOString();
  };

  const createAppointment = useMutation({
    mutationFn: async () => {
      const startDateTime = formData.all_day
        ? toLocalISOString(formData.start_date, '00:00')
        : toLocalISOString(formData.start_date, formData.start_time);

      const endDateTime = formData.all_day
        ? null
        : toLocalISOString(formData.start_date, formData.end_time);

      const deadlineTypeId = formData.appointment_type === 'prazo' && formData.deadline_type_id
        ? formData.deadline_type_id
        : null;

      const { data: inserted, error } = await supabase
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
          deadline_type_id: deadlineTypeId,
        }])
        .select('id')
        .single();

      if (error) throw error;

      // Auto-create checklist items from deadline type
      if (deadlineTypeId && inserted) {
        const deadlineType = deadlineTypes.find(dt => dt.id === deadlineTypeId);
        if (deadlineType?.checklist_items?.length) {
          const checks = deadlineType.checklist_items.map((item: ChecklistItem, idx: number) => ({
            appointment_id: inserted.id,
            check_key: item.key,
            check_label: item.label,
            is_checked: false,
            order_index: idx,
          }));
          await supabase.from('ipromed_appointment_checks').insert(checks);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ipromed-appointments-astrea'] });
      queryClient.invalidateQueries({ queryKey: ['ipromed-appointment-checks'] });
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

      const deadlineTypeId = formData.appointment_type === 'prazo' && formData.deadline_type_id
        ? formData.deadline_type_id
        : null;

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
          deadline_type_id: deadlineTypeId,
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

  // Toggle appointment check
  const toggleAppointmentCheck = useMutation({
    mutationFn: async ({ checkId, value }: { checkId: string; value: boolean }) => {
      const { error } = await supabase
        .from('ipromed_appointment_checks')
        .update({ is_checked: value })
        .eq('id', checkId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ipromed-appointment-checks'] });
    },
    onError: (error) => {
      toast.error('Erro ao atualizar: ' + error.message);
    },
  });

  // Create new deadline type
  const createDeadlineType = useMutation({
    mutationFn: async () => {
      if (!newDeadlineTypeName.trim() || newDeadlineTypeItems.length === 0) {
        throw new Error('Nome e itens são obrigatórios');
      }
      const { error } = await supabase
        .from('ipromed_deadline_types')
        .insert([{
          name: newDeadlineTypeName,
          checklist_items: newDeadlineTypeItems,
          is_default: false,
        }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ipromed-deadline-types'] });
      toast.success('Tipo de prazo criado!');
      setIsNewDeadlineTypeOpen(false);
      setNewDeadlineTypeName('');
      setNewDeadlineTypeItems([]);
      setNewItemLabel('');
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
      deadline_type_id: '',
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
      deadline_type_id: apt.deadline_type_id || '',
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
              {/* Dynamic deadline checks for prazo-type */}
              {apt.appointment_type === 'prazo' && (
                <div className="mt-2.5" onClick={(e) => e.stopPropagation()}>
                  {checksByAppointment[apt.id]?.length > 0 ? (
                    <div className="space-y-1.5 bg-white/60 rounded-lg p-2 border border-rose-100">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-rose-400 block mb-1">
                        {deadlineTypes?.find(dt => dt.id === apt.deadline_type_id)?.name || 'Checklist'}
                      </span>
                      {checksByAppointment[apt.id].map((check) => (
                        <div key={check.id} className="flex items-center gap-2">
                          <Checkbox
                            id={`sidebar-${check.id}`}
                            checked={check.is_checked}
                            onCheckedChange={(checked) => toggleAppointmentCheck.mutate({ checkId: check.id, value: !!checked })}
                            className="h-3.5 w-3.5"
                          />
                          <label htmlFor={`sidebar-${check.id}`} className={`text-[11px] cursor-pointer ${check.is_checked ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                            {check.check_label}
                          </label>
                          {check.is_checked ? (
                            <Check className="h-3 w-3 text-emerald-500 ml-auto flex-shrink-0" />
                          ) : (
                            <Clock className="h-3 w-3 text-rose-400 ml-auto flex-shrink-0" />
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white/60 rounded-lg p-2 border border-dashed border-rose-200">
                      <Select
                        onValueChange={async (dtId) => {
                          const dt = deadlineTypes?.find(d => d.id === dtId);
                          if (!dt) return;
                          // Set deadline type on appointment
                          await supabase.from('ipromed_appointments').update({ deadline_type_id: dtId }).eq('id', apt.id);
                          // Create checks
                          const checks = dt.checklist_items.map((item: ChecklistItem, idx: number) => ({
                            appointment_id: apt.id,
                            check_key: item.key,
                            check_label: item.label,
                            is_checked: false,
                            order_index: idx,
                          }));
                          await supabase.from('ipromed_appointment_checks').insert(checks);
                          queryClient.invalidateQueries({ queryKey: ['ipromed-appointments'] });
                          queryClient.invalidateQueries({ queryKey: ['ipromed-appointment-checks'] });
                          toast.success('Checklist aplicado');
                        }}
                      >
                        <SelectTrigger className="h-7 text-[11px] border-rose-200">
                          <SelectValue placeholder="Selecionar tipo de prazo..." />
                        </SelectTrigger>
                        <SelectContent>
                          {deadlineTypes?.map((dt) => (
                            <SelectItem key={dt.id} value={dt.id} className="text-xs">
                              {dt.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
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

            {/* Deadline type selector - only when type is prazo */}
            {formData.appointment_type === 'prazo' && (
              <div>
                <Label>Tipo de Prazo</Label>
                <div className="flex gap-2">
                  <Select
                    value={formData.deadline_type_id}
                    onValueChange={(v) => setFormData({ ...formData, deadline_type_id: v })}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Selecione o tipo de prazo" />
                    </SelectTrigger>
                    <SelectContent>
                      {deadlineTypes.map((dt) => (
                        <SelectItem key={dt.id} value={dt.id}>
                          {dt.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setIsNewDeadlineTypeOpen(true)}
                    title="Criar novo tipo"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {formData.deadline_type_id && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Checklist: {deadlineTypes.find(dt => dt.id === formData.deadline_type_id)?.checklist_items.map(i => i.label).join(' • ')}
                  </div>
                )}
              </div>
            )}

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

                  {/* Dynamic Deadline Checks for prazo-type */}
                  {selectedAppointment.appointment_type === 'prazo' && checksByAppointment[selectedAppointment.id]?.length > 0 && (
                    <div className="pt-3 border-t space-y-3">
                      <p className="text-sm font-medium">Checklist do Prazo</p>
                      <div className="space-y-2">
                        {checksByAppointment[selectedAppointment.id].map((check) => (
                          <div key={check.id} className="flex items-center gap-3">
                            <Checkbox
                              id={`detail-${check.id}`}
                              checked={check.is_checked}
                              onCheckedChange={(checked) => {
                                toggleAppointmentCheck.mutate({ checkId: check.id, value: !!checked });
                              }}
                            />
                            <Label htmlFor={`detail-${check.id}`} className={`cursor-pointer ${check.is_checked ? 'line-through text-muted-foreground' : ''}`}>
                              {check.check_label}
                            </Label>
                          </div>
                        ))}
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

      {/* New Deadline Type Dialog */}
      <Dialog open={isNewDeadlineTypeOpen} onOpenChange={setIsNewDeadlineTypeOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Tipo de Prazo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome do tipo</Label>
              <Input
                value={newDeadlineTypeName}
                onChange={(e) => setNewDeadlineTypeName(e.target.value)}
                placeholder="Ex: Prazo de Recurso"
              />
            </div>

            <div>
              <Label>Itens do Checklist</Label>
              <div className="space-y-2 mt-2">
                {newDeadlineTypeItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    <span className="flex-1">{item.label}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setNewDeadlineTypeItems(prev => prev.filter((_, i) => i !== idx))}
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <Input
                  value={newItemLabel}
                  onChange={(e) => setNewItemLabel(e.target.value)}
                  placeholder="Nome do item"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newItemLabel.trim()) {
                      e.preventDefault();
                      const key = newItemLabel.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
                      setNewDeadlineTypeItems(prev => [...prev, { key, label: newItemLabel.trim() }]);
                      setNewItemLabel('');
                    }
                  }}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (newItemLabel.trim()) {
                      const key = newItemLabel.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
                      setNewDeadlineTypeItems(prev => [...prev, { key, label: newItemLabel.trim() }]);
                      setNewItemLabel('');
                    }
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => {
                setIsNewDeadlineTypeOpen(false);
                setNewDeadlineTypeName('');
                setNewDeadlineTypeItems([]);
                setNewItemLabel('');
              }}>
                Cancelar
              </Button>
              <Button
                className="flex-1"
                onClick={() => createDeadlineType.mutate()}
                disabled={!newDeadlineTypeName.trim() || newDeadlineTypeItems.length === 0 || createDeadlineType.isPending}
              >
                {createDeadlineType.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Criar Tipo'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
