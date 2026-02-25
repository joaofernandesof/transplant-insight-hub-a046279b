import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Search, ChevronLeft, ChevronRight, Phone, User, Clock, Plus, Ban, Trash2
} from 'lucide-react';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { NeoTeamBreadcrumb } from '@/neohub/components/NeoTeamBreadcrumb';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// ── Types ──────────────────────────────────────────────────────
interface Doctor {
  id: string;
  full_name: string;
  specialty: string | null;
  consultation_duration_minutes: number | null;
  is_active: boolean;
  avatar_url: string | null;
}

interface DoctorScheduleRow {
  id: string;
  doctor_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number | null;
  is_active: boolean;
}

interface NeoteamAppointment {
  id: string;
  patient_id: string | null;
  patient_name: string;
  patient_phone: string | null;
  patient_email: string | null;
  doctor_id: string | null;
  doctor_name: string | null;
  appointment_date: string;
  appointment_time: string;
  duration_minutes: number;
  type: string;
  status: string;
  notes: string | null;
  branch: string | null;
  created_by: string | null;
}

interface ScheduleBlock {
  id: string;
  doctor_id: string | null;
  start_date: string;
  end_date: string;
  reason: string | null;
  is_all_doctors: boolean | null;
}

const STATUS_CONFIG: Record<string, { label: string; border: string; bg: string; text: string }> = {
  confirmado:     { label: 'Confirmado',     border: 'border-l-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/40',  text: 'text-emerald-700 dark:text-emerald-400' },
  agendado:       { label: 'Agendado',       border: 'border-l-blue-500',    bg: 'bg-blue-50 dark:bg-blue-950/40',       text: 'text-blue-700 dark:text-blue-400' },
  em_atendimento: { label: 'Em Atendimento', border: 'border-l-violet-500',  bg: 'bg-violet-50 dark:bg-violet-950/40',   text: 'text-violet-700 dark:text-violet-400' },
  concluido:      { label: 'Concluído',      border: 'border-l-gray-400',    bg: 'bg-gray-50 dark:bg-gray-800/50',       text: 'text-muted-foreground' },
  pendente:       { label: 'Pendente',        border: 'border-l-red-500',     bg: 'bg-red-50 dark:bg-red-950/40',         text: 'text-red-700 dark:text-red-400' },
  cancelado:      { label: 'Cancelado',      border: 'border-l-gray-300',    bg: 'bg-gray-50 dark:bg-gray-800/50',       text: 'text-muted-foreground line-through' },
  nao_compareceu: { label: 'Não Compareceu', border: 'border-l-orange-500',  bg: 'bg-orange-50 dark:bg-orange-950/40',   text: 'text-orange-700 dark:text-orange-400' },
  confirmed:   { label: 'Confirmado',     border: 'border-l-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/40',  text: 'text-emerald-700 dark:text-emerald-400' },
  scheduled:   { label: 'Agendado',       border: 'border-l-blue-500',    bg: 'bg-blue-50 dark:bg-blue-950/40',       text: 'text-blue-700 dark:text-blue-400' },
  in_progress: { label: 'Em Atendimento', border: 'border-l-violet-500',  bg: 'bg-violet-50 dark:bg-violet-950/40',   text: 'text-violet-700 dark:text-violet-400' },
  completed:   { label: 'Concluído',      border: 'border-l-gray-400',    bg: 'bg-gray-50 dark:bg-gray-800/50',       text: 'text-muted-foreground' },
  pending:     { label: 'Pendente',        border: 'border-l-red-500',     bg: 'bg-red-50 dark:bg-red-950/40',         text: 'text-red-700 dark:text-red-400' },
  cancelled:   { label: 'Cancelado',      border: 'border-l-gray-300',    bg: 'bg-gray-50 dark:bg-gray-800/50',       text: 'text-muted-foreground line-through' },
};

const HOUR_HEIGHT = 64;
const GRID_START_HOUR = 6;
const GRID_END_HOUR = 23;

// ── Hooks ──────────────────────────────────────────────────────
function useNeoTeamDoctors() {
  return useQuery({
    queryKey: ['neoteam-doctors-schedule'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('neoteam_doctors')
        .select('id, full_name, specialty, consultation_duration_minutes, is_active, avatar_url')
        .eq('is_active', true)
        .order('full_name');
      if (error) throw error;
      return data as Doctor[];
    },
  });
}

function useDoctorWeekSchedule(doctorId: string | null) {
  return useQuery({
    queryKey: ['neoteam-doctor-week-schedule', doctorId],
    queryFn: async () => {
      if (!doctorId) return [];
      const { data, error } = await supabase
        .from('neoteam_doctor_schedules')
        .select('*')
        .eq('doctor_id', doctorId)
        .eq('is_active', true);
      if (error) throw error;
      return data as DoctorScheduleRow[];
    },
    enabled: !!doctorId,
  });
}

function useNeoteamAppointments(doctorId: string | null, startDate: Date, endDate: Date) {
  const startStr = format(startDate, 'yyyy-MM-dd');
  const endStr = format(endDate, 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['neoteam-appointments', doctorId, startStr, endStr],
    queryFn: async () => {
      if (!doctorId) return [];

      const { data, error } = await supabase
        .from('neoteam_appointments')
        .select('*')
        .eq('doctor_id', doctorId)
        .gte('appointment_date', startStr)
        .lte('appointment_date', endStr)
        .neq('status', 'cancelado')
        .order('appointment_date')
        .order('appointment_time');
      if (error) throw error;
      return (data || []) as NeoteamAppointment[];
    },
    enabled: !!doctorId,
  });
}

function useNeoteamBranches() {
  return useQuery({
    queryKey: ['neoteam-branches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('neoteam_branches')
        .select('id, name, code')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data || [];
    },
  });
}

function useScheduleBlocks(doctorId: string | null, startDate: Date, endDate: Date) {
  const startStr = format(startDate, 'yyyy-MM-dd');
  const endStr = format(endDate, 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['neoteam-schedule-blocks', doctorId, startStr, endStr],
    queryFn: async () => {
      if (!doctorId) return [];

      const { data, error } = await supabase
        .from('neoteam_schedule_blocks')
        .select('*')
        .or(`doctor_id.eq.${doctorId},is_all_doctors.eq.true`)
        .lte('start_date', endStr)
        .gte('end_date', startStr);

      if (error) throw error;
      return (data || []) as ScheduleBlock[];
    },
    enabled: !!doctorId,
  });
}

// ── Helpers ────────────────────────────────────────────────────
function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + (m || 0);
}

function getStatusConfig(status: string | null) {
  return STATUS_CONFIG[status || 'agendado'] || STATUS_CONFIG.agendado;
}

// ── Main Component ─────────────────────────────────────────────
export default function NeoTeamSchedule() {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [view, setView] = useState<'day' | 'week'>('day');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState<NeoteamAppointment | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);

  // Dialogs
  const [showAddAppointment, setShowAddAppointment] = useState(false);
  const [showAddBlock, setShowAddBlock] = useState(false);
  const [clickedTime, setClickedTime] = useState<string | null>(null);
  const [clickedDate, setClickedDate] = useState<Date | null>(null);

  const { data: doctors = [] } = useNeoTeamDoctors();
  const { data: doctorSchedules = [] } = useDoctorWeekSchedule(selectedDoctorId);
  const { data: branches = [] } = useNeoteamBranches();

  const weekStart = useMemo(() => startOfWeek(selectedDate, { weekStartsOn: 1 }), [selectedDate]);
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  const rangeStart = view === 'day' ? selectedDate : weekStart;
  const rangeEnd = view === 'day' ? selectedDate : weekDays[6];

  const { data: allAppointments = [] } = useNeoteamAppointments(selectedDoctorId, rangeStart, rangeEnd);
  const { data: scheduleBlocks = [] } = useScheduleBlocks(selectedDoctorId, rangeStart, rangeEnd);

  const appointments = useMemo(() => {
    if (!selectedBranch) return allAppointments;
    return allAppointments.filter(a => a.branch === selectedBranch);
  }, [allAppointments, selectedBranch]);

  const selectedDoctor = doctors.find(d => d.id === selectedDoctorId) || null;

  const filteredDoctors = useMemo(() => {
    if (!searchQuery.trim()) return doctors;
    const q = searchQuery.toLowerCase();
    return doctors.filter(d =>
      d.full_name.toLowerCase().includes(q) ||
      (d.specialty && d.specialty.toLowerCase().includes(q))
    );
  }, [doctors, searchQuery]);

  const getAppointmentsForDay = useCallback((date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return appointments.filter(a => a.appointment_date === dateStr);
  }, [appointments]);

  const getBlocksForDay = useCallback((date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return scheduleBlocks.filter(b => dateStr >= b.start_date && dateStr <= b.end_date);
  }, [scheduleBlocks]);

  const getDaySchedule = useCallback((date: Date) => {
    const dow = date.getDay();
    return doctorSchedules.find(s => s.day_of_week === dow);
  }, [doctorSchedules]);

  const navigateDate = (dir: number) => {
    setSelectedDate(prev => addDays(prev, view === 'week' ? dir * 7 : dir));
  };

  const hours = useMemo(() => {
    const h: number[] = [];
    for (let i = GRID_START_HOUR; i <= GRID_END_HOUR; i++) h.push(i);
    return h;
  }, []);

  const handleGridClick = (date: Date, hour: number) => {
    if (!selectedDoctorId) return;
    const timeStr = `${String(hour).padStart(2, '0')}:00`;
    setClickedTime(timeStr);
    setClickedDate(date);
    setShowAddAppointment(true);
  };

  const handleOpenAddBlock = () => {
    setShowAddBlock(true);
  };

  // Delete block mutation
  const deleteBlock = useMutation({
    mutationFn: async (blockId: string) => {
      const { error } = await supabase.from('neoteam_schedule_blocks').delete().eq('id', blockId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['neoteam-schedule-blocks'] });
      toast.success('Bloqueio removido!');
    },
    onError: (err: Error) => toast.error('Erro ao remover bloqueio: ' + err.message),
  });

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <NeoTeamBreadcrumb />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Agenda</h1>
          <p className="text-sm text-muted-foreground">Gestão de agendamentos por profissional</p>
        </div>
      </div>

      <div className="flex gap-6 h-[calc(100vh-180px)]">
        {/* ── LEFT PANEL ──────────────────────────────────── */}
        <div className="w-[300px] flex-shrink-0 flex flex-col gap-4 overflow-y-auto">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar profissional..."
              className="pl-9"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Doctor Selection */}
          <Card>
            <CardHeader className="pb-2 pt-3 px-3">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Profissional
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-2">
              <ScrollArea className="h-[180px]">
                <div className="space-y-1">
                  {filteredDoctors.map(doc => {
                    const isSelected = selectedDoctorId === doc.id;
                    return (
                      <button
                        key={doc.id}
                        onClick={() => setSelectedDoctorId(doc.id)}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all text-sm',
                          isSelected
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'hover:bg-muted/60'
                        )}
                      >
                        <div className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
                          isSelected ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'
                        )}>
                          {doc.full_name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{doc.full_name}</p>
                          {doc.specialty && (
                            <p className={cn('text-xs truncate', isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                              {doc.specialty}
                            </p>
                          )}
                        </div>
                        <div className={cn(
                          'ml-auto w-2 h-2 rounded-full flex-shrink-0',
                          doc.is_active ? 'bg-emerald-500' : 'bg-gray-400'
                        )} />
                      </button>
                    );
                  })}
                  {filteredDoctors.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">Nenhum profissional encontrado</p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Mini Calendar */}
          <Card>
            <CardContent className="p-2">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="rounded-md pointer-events-auto"
                locale={ptBR}
              />
            </CardContent>
          </Card>

          {/* Branch Filter */}
          <Card>
            <CardHeader className="pb-2 pt-3 px-3">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                🏥 Unidade
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-2">
              <div className="space-y-1">
                <button
                  onClick={() => setSelectedBranch(null)}
                  className={cn(
                    'w-full text-left text-sm px-3 py-2 rounded-lg transition-colors',
                    !selectedBranch ? 'bg-primary text-primary-foreground' : 'hover:bg-muted/60'
                  )}
                >
                  Todas
                </button>
                {branches.map(b => (
                  <button
                    key={b.id}
                    onClick={() => setSelectedBranch(b.name)}
                    className={cn(
                      'w-full text-left text-sm px-3 py-2 rounded-lg transition-colors',
                      selectedBranch === b.name ? 'bg-primary text-primary-foreground' : 'hover:bg-muted/60'
                    )}
                  >
                    {b.name}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Doctor Info */}
          {selectedDoctor && (
            <Card>
              <CardContent className="p-3 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Detalhes</p>
                <div className="text-sm space-y-1">
                  <p><span className="text-muted-foreground">Duração padrão:</span> {selectedDoctor.consultation_duration_minutes || 30}min</p>
                  <p><span className="text-muted-foreground">Especialidade:</span> {selectedDoctor.specialty || '—'}</p>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <div className={cn('w-2 h-2 rounded-full', selectedDoctor.is_active ? 'bg-emerald-500' : 'bg-gray-400')} />
                  <span className="text-xs text-muted-foreground">{selectedDoctor.is_active ? 'Ativo' : 'Inativo'}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Active Blocks */}
          {selectedDoctorId && scheduleBlocks.length > 0 && (
            <Card>
              <CardHeader className="pb-2 pt-3 px-3">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  🔒 Bloqueios ativos
                </CardTitle>
              </CardHeader>
              <CardContent className="px-2 pb-2 space-y-1">
                {scheduleBlocks.map(block => (
                  <div key={block.id} className="flex items-center justify-between p-2 rounded-lg bg-red-50 dark:bg-red-950/30 text-xs">
                    <div>
                      <p className="font-medium text-red-700 dark:text-red-400">
                        {block.start_date === block.end_date
                          ? block.start_date.split('-').reverse().join('/')
                          : `${block.start_date.split('-').reverse().join('/')} – ${block.end_date.split('-').reverse().join('/')}`
                        }
                      </p>
                      {block.reason && <p className="text-muted-foreground">{block.reason}</p>}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-red-500 hover:text-red-700"
                      onClick={() => deleteBlock.mutate(block.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── RIGHT PANEL ─────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Navigation Bar */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => navigateDate(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-base font-semibold min-w-[200px] text-center">
                {view === 'day'
                  ? format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })
                  : `${format(weekDays[0], "dd MMM", { locale: ptBR })} — ${format(weekDays[6], "dd MMM yyyy", { locale: ptBR })}`
                }
              </h2>
              <Button variant="ghost" size="icon" onClick={() => navigateDate(1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setSelectedDate(new Date())} className="ml-2 text-xs">
                Hoje
              </Button>
            </div>
            <div className="flex items-center gap-2">
              {selectedDoctorId && (
                <Button variant="outline" size="sm" onClick={handleOpenAddBlock} className="text-xs gap-1">
                  <Ban className="h-3.5 w-3.5" />
                  Bloquear
                </Button>
              )}
              <Tabs value={view} onValueChange={(v) => setView(v as 'day' | 'week')}>
                <TabsList className="h-8">
                  <TabsTrigger value="day" className="text-xs px-3">Dia</TabsTrigger>
                  <TabsTrigger value="week" className="text-xs px-3">Semana</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {/* Grid */}
          {!selectedDoctorId ? (
            <div className="flex-1 flex items-center justify-center border rounded-lg bg-muted/20">
              <div className="text-center space-y-2">
                <User className="h-12 w-12 text-muted-foreground/40 mx-auto" />
                <p className="text-muted-foreground font-medium">Selecione um profissional para visualizar a agenda.</p>
              </div>
            </div>
          ) : (
            <Card className="flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="min-w-[600px]">
                  {view === 'day' ? (
                    <DayGrid
                      date={selectedDate}
                      hours={hours}
                      appointments={getAppointmentsForDay(selectedDate)}
                      blocks={getBlocksForDay(selectedDate)}
                      schedule={getDaySchedule(selectedDate)}
                      defaultDuration={selectedDoctor?.consultation_duration_minutes || 30}
                      onClickAppointment={setSelectedAppointment}
                      onClickSlot={(hour) => handleGridClick(selectedDate, hour)}
                    />
                  ) : (
                    <WeekGrid
                      days={weekDays}
                      hours={hours}
                      appointments={appointments}
                      blocks={scheduleBlocks}
                      schedules={doctorSchedules}
                      defaultDuration={selectedDoctor?.consultation_duration_minutes || 30}
                      onClickAppointment={setSelectedAppointment}
                      onClickSlot={(date, hour) => handleGridClick(date, hour)}
                    />
                  )}
                </div>
              </ScrollArea>
            </Card>
          )}
        </div>
      </div>

      {/* FAB */}
      {selectedDoctorId && (
        <Button
          size="lg"
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
          onClick={() => {
            setClickedTime(null);
            setClickedDate(null);
            setShowAddAppointment(true);
          }}
        >
          <Plus className="h-6 w-6" />
        </Button>
      )}

      {/* Appointment Detail Modal */}
      <Dialog open={!!selectedAppointment} onOpenChange={() => setSelectedAppointment(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Detalhes do Agendamento</DialogTitle>
          </DialogHeader>
          {selectedAppointment && (
            <AppointmentDetail appointment={selectedAppointment} />
          )}
        </DialogContent>
      </Dialog>

      {/* Add Appointment Dialog */}
      <AddAppointmentDialog
        open={showAddAppointment}
        onOpenChange={setShowAddAppointment}
        doctorId={selectedDoctorId}
        doctorName={selectedDoctor?.full_name || ''}
        defaultDate={clickedDate || selectedDate}
        defaultTime={clickedTime || ''}
        defaultDuration={selectedDoctor?.consultation_duration_minutes || 30}
        branches={branches}
      />

      {/* Add Block Dialog */}
      <AddBlockDialog
        open={showAddBlock}
        onOpenChange={setShowAddBlock}
        doctorId={selectedDoctorId}
        doctorName={selectedDoctor?.full_name || ''}
        defaultDate={selectedDate}
      />
    </div>
  );
}

// ── Add Appointment Dialog ─────────────────────────────────────
function AddAppointmentDialog({
  open,
  onOpenChange,
  doctorId,
  doctorName,
  defaultDate,
  defaultTime,
  defaultDuration,
  branches,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doctorId: string | null;
  doctorName: string;
  defaultDate: Date;
  defaultTime: string;
  defaultDuration: number;
  branches: { id: string; name: string; code: string }[];
}) {
  const queryClient = useQueryClient();
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientEmail, setPatientEmail] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [duration, setDuration] = useState(30);
  const [type, setType] = useState('Consulta');
  const [branch, setBranch] = useState('');
  const [notes, setNotes] = useState('');

  // Reset form when dialog opens
  React.useEffect(() => {
    if (open) {
      setPatientName('');
      setPatientPhone('');
      setPatientEmail('');
      setAppointmentDate(format(defaultDate, 'yyyy-MM-dd'));
      setAppointmentTime(defaultTime || '08:00');
      setDuration(defaultDuration);
      setType('Consulta');
      setBranch('');
      setNotes('');
    }
  }, [open, defaultDate, defaultTime, defaultDuration]);

  const createAppointment = useMutation({
    mutationFn: async () => {
      if (!doctorId || !patientName.trim() || !appointmentDate || !appointmentTime) {
        throw new Error('Preencha todos os campos obrigatórios');
      }

      const { error } = await supabase
        .from('neoteam_appointments')
        .insert({
          doctor_id: doctorId,
          doctor_name: doctorName,
          patient_name: patientName.trim(),
          patient_phone: patientPhone || null,
          patient_email: patientEmail || null,
          appointment_date: appointmentDate,
          appointment_time: appointmentTime,
          duration_minutes: duration,
          type,
          status: 'agendado',
          branch: branch || null,
          notes: notes || null,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['neoteam-appointments'] });
      toast.success('Agendamento criado com sucesso!');
      onOpenChange(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo Agendamento</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label>Nome do paciente *</Label>
              <Input value={patientName} onChange={e => setPatientName(e.target.value)} placeholder="Nome completo" />
            </div>
            <div>
              <Label>Telefone</Label>
              <Input value={patientPhone} onChange={e => setPatientPhone(e.target.value)} placeholder="(85) 99999-9999" />
            </div>
            <div>
              <Label>E-mail</Label>
              <Input value={patientEmail} onChange={e => setPatientEmail(e.target.value)} placeholder="email@exemplo.com" />
            </div>
            <div>
              <Label>Data *</Label>
              <Input type="date" value={appointmentDate} onChange={e => setAppointmentDate(e.target.value)} />
            </div>
            <div>
              <Label>Horário *</Label>
              <Input type="time" value={appointmentTime} onChange={e => setAppointmentTime(e.target.value)} />
            </div>
            <div>
              <Label>Duração (min)</Label>
              <Select value={String(duration)} onValueChange={v => setDuration(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 min</SelectItem>
                  <SelectItem value="30">30 min</SelectItem>
                  <SelectItem value="45">45 min</SelectItem>
                  <SelectItem value="60">60 min</SelectItem>
                  <SelectItem value="90">90 min</SelectItem>
                  <SelectItem value="120">120 min</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Consulta">Consulta</SelectItem>
                  <SelectItem value="Retorno">Retorno</SelectItem>
                  <SelectItem value="Procedimento">Procedimento</SelectItem>
                  <SelectItem value="Avaliação">Avaliação</SelectItem>
                  <SelectItem value="Outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {branches.length > 0 && (
              <div className="col-span-2">
                <Label>Unidade</Label>
                <Select value={branch} onValueChange={setBranch}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {branches.map(b => (
                      <SelectItem key={b.id} value={b.name}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="col-span-2">
              <Label>Observações</Label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Observações adicionais..." rows={2} />
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            Profissional: <strong>{doctorName}</strong>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => createAppointment.mutate()} disabled={createAppointment.isPending}>
            {createAppointment.isPending ? 'Salvando...' : 'Agendar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Add Block Dialog ───────────────────────────────────────────
function AddBlockDialog({
  open,
  onOpenChange,
  doctorId,
  doctorName,
  defaultDate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doctorId: string | null;
  doctorName: string;
  defaultDate: Date;
}) {
  const queryClient = useQueryClient();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  React.useEffect(() => {
    if (open) {
      const dateStr = format(defaultDate, 'yyyy-MM-dd');
      setStartDate(dateStr);
      setEndDate(dateStr);
      setReason('');
    }
  }, [open, defaultDate]);

  const createBlock = useMutation({
    mutationFn: async () => {
      if (!doctorId || !startDate || !endDate) {
        throw new Error('Preencha as datas');
      }

      const { error } = await supabase
        .from('neoteam_schedule_blocks')
        .insert({
          doctor_id: doctorId,
          start_date: startDate,
          end_date: endDate,
          reason: reason || null,
          is_all_doctors: false,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['neoteam-schedule-blocks'] });
      toast.success('Horário bloqueado com sucesso!');
      onOpenChange(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ban className="h-5 w-5 text-red-500" />
            Bloquear Horário
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="text-sm text-muted-foreground">
            Profissional: <strong className="text-foreground">{doctorName}</strong>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Data início *</Label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div>
              <Label>Data fim *</Label>
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Motivo</Label>
            <Textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Ex: Férias, congresso, folga..." rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button variant="destructive" onClick={() => createBlock.mutate()} disabled={createBlock.isPending}>
            {createBlock.isPending ? 'Salvando...' : 'Bloquear'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Day Grid ───────────────────────────────────────────────────
function DayGrid({
  date,
  hours,
  appointments,
  blocks,
  schedule,
  defaultDuration,
  onClickAppointment,
  onClickSlot,
}: {
  date: Date;
  hours: number[];
  appointments: NeoteamAppointment[];
  blocks: ScheduleBlock[];
  schedule: DoctorScheduleRow | undefined;
  defaultDuration: number;
  onClickAppointment: (a: NeoteamAppointment) => void;
  onClickSlot: (hour: number) => void;
}) {
  const workStart = schedule ? timeToMinutes(schedule.start_time) : null;
  const workEnd = schedule ? timeToMinutes(schedule.end_time) : null;
  const isBlocked = blocks.length > 0;

  return (
    <div className="relative">
      {hours.map(hour => {
        const minuteStart = hour * 60;
        const isWorkHour = workStart !== null && workEnd !== null && minuteStart >= workStart && minuteStart < workEnd;
        return (
          <div
            key={hour}
            className={cn(
              'flex border-b border-border/40 cursor-pointer hover:bg-muted/20 transition-colors',
              isWorkHour ? 'bg-background' : 'bg-muted/30',
              isBlocked && isWorkHour && 'bg-red-50/50 dark:bg-red-950/20'
            )}
            style={{ height: HOUR_HEIGHT }}
            onClick={() => onClickSlot(hour)}
          >
            <div className="w-16 flex-shrink-0 pr-2 pt-1 text-right">
              <span className="text-[11px] text-muted-foreground font-mono">
                {String(hour).padStart(2, '0')}:00
              </span>
            </div>
            <div className="flex-1 border-l border-border/30 relative">
              <div className="absolute top-1/2 left-0 right-0 border-t border-dashed border-border/20" />
              {isBlocked && isWorkHour && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="text-[10px] text-red-500/60 font-medium">BLOQUEADO</span>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Appointment blocks */}
      <div className="absolute top-0 left-16 right-0">
        {appointments.map(apt => {
          const aptMinutes = timeToMinutes(apt.appointment_time);
          const duration = apt.duration_minutes || defaultDuration;
          const top = ((aptMinutes - GRID_START_HOUR * 60) / 60) * HOUR_HEIGHT;
          const height = Math.max((duration / 60) * HOUR_HEIGHT, 28);
          const config = getStatusConfig(apt.status);
          const endTime = aptMinutes + duration;
          const endH = String(Math.floor(endTime / 60)).padStart(2, '0');
          const endM = String(endTime % 60).padStart(2, '0');

          return (
            <button
              key={apt.id}
              onClick={(e) => { e.stopPropagation(); onClickAppointment(apt); }}
              className={cn(
                'absolute left-1 right-3 rounded-md border-l-[3px] px-2.5 py-1 transition-all hover:shadow-md cursor-pointer overflow-hidden z-10',
                config.border, config.bg
              )}
              style={{ top, height }}
            >
              <div className="flex items-start justify-between gap-1">
                <div className="min-w-0 text-left">
                  <p className={cn('text-xs font-semibold truncate', config.text)}>
                    {apt.patient_name}
                  </p>
                  {height > 36 && (
                    <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                      {apt.type} • {apt.appointment_time.substring(0, 5)}–{endH}:{endM}
                    </p>
                  )}
                </div>
                {apt.patient_phone && height > 36 && (
                  <a href={`tel:${apt.patient_phone}`} className="text-muted-foreground hover:text-foreground flex-shrink-0 mt-0.5" onClick={e => e.stopPropagation()}>
                    <Phone className="h-3 w-3" />
                  </a>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Week Grid ──────────────────────────────────────────────────
function WeekGrid({
  days,
  hours,
  appointments,
  blocks,
  schedules,
  defaultDuration,
  onClickAppointment,
  onClickSlot,
}: {
  days: Date[];
  hours: number[];
  appointments: NeoteamAppointment[];
  blocks: ScheduleBlock[];
  schedules: DoctorScheduleRow[];
  defaultDuration: number;
  onClickAppointment: (a: NeoteamAppointment) => void;
  onClickSlot: (date: Date, hour: number) => void;
}) {
  const getAptsForDay = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return appointments.filter(a => a.appointment_date === dateStr);
  };

  const getScheduleForDay = (date: Date) =>
    schedules.find(s => s.day_of_week === date.getDay());

  const isDayBlocked = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return blocks.some(b => dateStr >= b.start_date && dateStr <= b.end_date);
  };

  return (
    <div className="relative">
      {/* Day headers */}
      <div className="flex sticky top-0 z-10 bg-background border-b">
        <div className="w-16 flex-shrink-0" />
        {days.map(day => {
          const isToday = isSameDay(day, new Date());
          const blocked = isDayBlocked(day);
          return (
            <div key={day.toISOString()} className={cn(
              'flex-1 text-center py-2 border-l border-border/30',
              isToday && 'bg-primary/5',
              blocked && 'bg-red-50/50 dark:bg-red-950/20'
            )}>
              <p className="text-[10px] uppercase text-muted-foreground font-medium">
                {format(day, 'EEE', { locale: ptBR })}
              </p>
              <p className={cn(
                'text-sm font-bold',
                isToday && 'text-primary',
                blocked && 'text-red-500'
              )}>
                {format(day, 'dd')}
                {blocked && ' 🔒'}
              </p>
            </div>
          );
        })}
      </div>

      {/* Grid */}
      <div className="relative">
        {hours.map(hour => (
          <div key={hour} className="flex border-b border-border/40" style={{ height: HOUR_HEIGHT }}>
            <div className="w-16 flex-shrink-0 pr-2 pt-1 text-right">
              <span className="text-[11px] text-muted-foreground font-mono">
                {String(hour).padStart(2, '0')}:00
              </span>
            </div>
            {days.map(day => {
              const daySchedule = getScheduleForDay(day);
              const minuteStart = hour * 60;
              const isWorkHour = daySchedule
                ? minuteStart >= timeToMinutes(daySchedule.start_time) && minuteStart < timeToMinutes(daySchedule.end_time)
                : false;
              const blocked = isDayBlocked(day);
              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    'flex-1 border-l border-border/30 relative cursor-pointer hover:bg-muted/20 transition-colors',
                    isWorkHour ? 'bg-background' : 'bg-muted/30',
                    blocked && isWorkHour && 'bg-red-50/50 dark:bg-red-950/20'
                  )}
                  onClick={() => onClickSlot(day, hour)}
                >
                  <div className="absolute top-1/2 left-0 right-0 border-t border-dashed border-border/20" />
                </div>
              );
            })}
          </div>
        ))}

        {/* Appointment overlays */}
        <div className="absolute top-0 left-16 right-0 flex">
          {days.map(day => {
            const dayApts = getAptsForDay(day);
            return (
              <div key={day.toISOString()} className="flex-1 relative" style={{ minHeight: hours.length * HOUR_HEIGHT }}>
                {dayApts.map(apt => {
                  const aptMinutes = timeToMinutes(apt.appointment_time);
                  const duration = apt.duration_minutes || defaultDuration;
                  const top = ((aptMinutes - GRID_START_HOUR * 60) / 60) * HOUR_HEIGHT;
                  const height = Math.max((duration / 60) * HOUR_HEIGHT, 24);
                  const config = getStatusConfig(apt.status);

                  return (
                    <button
                      key={apt.id}
                      onClick={(e) => { e.stopPropagation(); onClickAppointment(apt); }}
                      className={cn(
                        'absolute left-0.5 right-0.5 rounded border-l-[3px] px-1 py-0.5 transition-all hover:shadow-md cursor-pointer overflow-hidden z-10',
                        config.border, config.bg
                      )}
                      style={{ top, height }}
                    >
                      <p className={cn('text-[10px] font-semibold truncate', config.text)}>
                        {apt.patient_name}
                      </p>
                      {height > 30 && (
                        <p className="text-[9px] text-muted-foreground truncate">
                          {apt.appointment_time.substring(0, 5)}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Appointment Detail ─────────────────────────────────────────
function AppointmentDetail({ appointment }: { appointment: NeoteamAppointment }) {
  const duration = appointment.duration_minutes || 30;
  const endMinutes = timeToMinutes(appointment.appointment_time) + duration;
  const endH = String(Math.floor(endMinutes / 60)).padStart(2, '0');
  const endM = String(endMinutes % 60).padStart(2, '0');
  const config = getStatusConfig(appointment.status);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold bg-muted text-muted-foreground">
          {appointment.patient_name.split(' ').map(n => n[0]).slice(0, 2).join('')}
        </div>
        <div>
          <p className="font-semibold">{appointment.patient_name}</p>
          {appointment.patient_phone && (
            <a href={`tel:${appointment.patient_phone}`} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
              <Phone className="h-3 w-3" />
              {appointment.patient_phone}
            </a>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-muted-foreground text-xs">Data</p>
          <p className="font-medium">{appointment.appointment_date.split('-').reverse().join('/')}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Horário</p>
          <p className="font-medium">
            {appointment.appointment_time.substring(0, 5)} – {endH}:{endM}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Tipo</p>
          <p className="font-medium">{appointment.type}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Status</p>
          <Badge variant="outline" className={cn('text-xs', config.text, config.bg)}>
            {config.label}
          </Badge>
        </div>
        {appointment.branch && (
          <div>
            <p className="text-muted-foreground text-xs">Unidade</p>
            <p className="font-medium">{appointment.branch}</p>
          </div>
        )}
        {appointment.doctor_name && (
          <div>
            <p className="text-muted-foreground text-xs">Profissional</p>
            <p className="font-medium">{appointment.doctor_name}</p>
          </div>
        )}
      </div>

      {appointment.notes && (
        <div>
          <p className="text-muted-foreground text-xs mb-1">Observações</p>
          <p className="text-sm bg-muted/50 p-2 rounded">{appointment.notes}</p>
        </div>
      )}
    </div>
  );
}
