/**
 * CPG Advocacia Médica - Workspace Agenda (Kanban 7 dias)
 * Visualização horizontal tipo kanban dos próximos 7 dias
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  ChevronRight,
  Clock,
  MapPin,
  Video,
  Users,
  Gavel,
  Bell,
  CheckCircle2,
  Cake,
  Stethoscope,
} from "lucide-react";
import { format, addDays, startOfDay, endOfDay, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

interface UnifiedAppointment {
  id: string;
  title: string;
  start_datetime: string;
  end_datetime: string | null;
  location?: string | null;
  is_virtual: boolean;
  meeting_url?: string | null;
  status: string;
  appointment_type: string;
  client_name?: string | null;
  source: 'appointment' | 'meeting';
}

const typeConfig: Record<string, {
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}> = {
  reuniao: { label: 'Reunião', icon: Users, color: 'text-sky-700', bgColor: 'bg-sky-50 border-sky-200' },
  audiencia: { label: 'Audiência', icon: Gavel, color: 'text-violet-700', bgColor: 'bg-violet-50 border-violet-200' },
  prazo: { label: 'Prazo', icon: Clock, color: 'text-rose-700', bgColor: 'bg-rose-50 border-rose-200' },
  lembrete: { label: 'Lembrete', icon: Bell, color: 'text-amber-700', bgColor: 'bg-amber-50 border-amber-200' },
  tarefa: { label: 'Tarefa', icon: CheckCircle2, color: 'text-emerald-700', bgColor: 'bg-emerald-50 border-emerald-200' },
  onboarding: { label: 'Onboarding', icon: Users, color: 'text-teal-700', bgColor: 'bg-teal-50 border-teal-200' },
  apresentacao: { label: 'Apresentação', icon: Users, color: 'text-indigo-700', bgColor: 'bg-indigo-50 border-indigo-200' },
  acompanhamento: { label: 'Acompanhamento', icon: Users, color: 'text-cyan-700', bgColor: 'bg-cyan-50 border-cyan-200' },
  meeting: { label: 'Reunião', icon: Users, color: 'text-sky-700', bgColor: 'bg-sky-50 border-sky-200' },
  aniversario: { label: 'Aniversário', icon: Cake, color: 'text-pink-700', bgColor: 'bg-pink-50 border-pink-200' },
  dia_especialidade: { label: 'Especialidade', icon: Stethoscope, color: 'text-emerald-700', bgColor: 'bg-emerald-50 border-emerald-200' },
};

const DAYS_AHEAD = 7;

function getDayLabel(date: Date, today: Date): string {
  if (isSameDay(date, today)) return 'Hoje';
  if (isSameDay(date, addDays(today, 1))) return 'Amanhã';
  return format(date, "EEE", { locale: ptBR });
}

export function WorkspaceAgenda() {
  const navigate = useNavigate();
  const today = startOfDay(new Date());
  const endDate = endOfDay(addDays(today, DAYS_AHEAD - 1));

  // Generate array of days
  const days = Array.from({ length: DAYS_AHEAD }, (_, i) => addDays(today, i));

  const { data: appointments, isLoading } = useQuery({
    queryKey: ['workspace-agenda-kanban', format(today, 'yyyy-MM-dd')],
    queryFn: async () => {
      const todayStr = format(today, 'yyyy-MM-dd');
      const endStr = format(addDays(today, DAYS_AHEAD - 1), 'yyyy-MM-dd');

      // Generate MM-DD for each day for birthday/specialty matching
      const dayMMDDs = days.map(d => format(d, 'MM-dd'));

      const [regularRes, meetingsRes, clientsRes, specialtyDaysRes] = await Promise.all([
        supabase
          .from('ipromed_appointments')
          .select(`*, ipromed_legal_clients(name)`)
          .gte('start_datetime', today.toISOString())
          .lte('start_datetime', endDate.toISOString())
          .neq('status', 'cancelled')
          .order('start_datetime', { ascending: true }),
        supabase
          .from('ipromed_client_meetings')
          .select(`*, ipromed_legal_clients(name)`)
          .gte('scheduled_date', todayStr)
          .lte('scheduled_date', endStr)
          .neq('status', 'cancelled')
          .order('scheduled_date', { ascending: true }),
        supabase
          .from('ipromed_legal_clients')
          .select('id, name, medical_specialty, birth_date')
          .or('birth_date.not.is.null,medical_specialty.not.is.null'),
        supabase
          .from('ipromed_specialty_days')
          .select('specialty, celebration_date, description'),
      ]);

      if (regularRes.error) throw regularRes.error;
      if (meetingsRes.error) throw meetingsRes.error;

      const allAppointments: UnifiedAppointment[] = [];

      // Regular appointments
      (regularRes.data || []).forEach((apt: any) => {
        allAppointments.push({
          id: apt.id,
          title: apt.title,
          start_datetime: apt.start_datetime,
          end_datetime: apt.end_datetime,
          location: apt.location,
          is_virtual: apt.is_virtual || false,
          meeting_url: apt.meeting_url,
          status: apt.status,
          appointment_type: apt.appointment_type || 'reuniao',
          client_name: apt.ipromed_legal_clients?.name,
          source: 'appointment',
        });
      });

      // Client meetings
      (meetingsRes.data || []).forEach((meeting: any) => {
        const startDatetime = `${meeting.scheduled_date}T${meeting.scheduled_time || '09:00'}:00`;
        let endDatetime: string | null = null;
        if (meeting.duration_minutes) {
          const endD = new Date(startDatetime);
          endD.setMinutes(endD.getMinutes() + meeting.duration_minutes);
          endDatetime = endD.toISOString();
        }
        allAppointments.push({
          id: meeting.id,
          title: meeting.title || 'Reunião',
          start_datetime: startDatetime,
          end_datetime: endDatetime,
          location: meeting.location,
          is_virtual: meeting.modality === 'virtual',
          meeting_url: meeting.meeting_link,
          status: meeting.status,
          appointment_type: meeting.agenda_type || 'reuniao',
          client_name: meeting.ipromed_legal_clients?.name,
          source: 'meeting',
        });
      });

      // Birthday events
      const clients = clientsRes.data || [];
      for (const client of clients) {
        if (!client.birth_date) continue;
        const birthMMDD = client.birth_date.substring(5);
        const matchIdx = dayMMDDs.indexOf(birthMMDD);
        if (matchIdx !== -1) {
          const eventDate = format(days[matchIdx], 'yyyy-MM-dd');
          allAppointments.push({
            id: `birthday-${client.id}`,
            title: `🎂 Aniversário: ${client.name}`,
            start_datetime: `${eventDate}T08:00:00`,
            end_datetime: null,
            location: null,
            is_virtual: false,
            meeting_url: null,
            status: 'confirmed',
            appointment_type: 'aniversario',
            client_name: client.name,
            source: 'appointment',
          });
        }
      }

      // Specialty day events
      const specialtyDays = specialtyDaysRes.data || [];
      const specialtyMap = new Map(specialtyDays.map(s => [s.specialty, s]));
      for (const client of clients) {
        if (!client.medical_specialty) continue;
        const specDay = specialtyMap.get(client.medical_specialty);
        if (!specDay) continue;
        const matchIdx = dayMMDDs.indexOf(specDay.celebration_date);
        if (matchIdx !== -1) {
          const eventDate = format(days[matchIdx], 'yyyy-MM-dd');
          allAppointments.push({
            id: `specialty-${client.id}`,
            title: `⚕️ ${specDay.description}: ${client.name}`,
            start_datetime: `${eventDate}T08:00:00`,
            end_datetime: null,
            location: null,
            is_virtual: false,
            meeting_url: null,
            status: 'confirmed',
            appointment_type: 'dia_especialidade',
            client_name: client.name,
            source: 'appointment',
          });
        }
      }

      allAppointments.sort((a, b) =>
        new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime()
      );

      return allAppointments;
    },
  });

  // Group appointments by day
  const appointmentsByDay = new Map<string, UnifiedAppointment[]>();
  days.forEach(day => {
    const key = format(day, 'yyyy-MM-dd');
    appointmentsByDay.set(key, []);
  });
  appointments?.forEach(apt => {
    const key = format(new Date(apt.start_datetime), 'yyyy-MM-dd');
    if (appointmentsByDay.has(key)) {
      appointmentsByDay.get(key)!.push(apt);
    }
  });

  if (isLoading) {
    return (
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-2 px-5 pt-5">
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <div className="flex gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-48 w-48 shrink-0" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="pb-2 px-5 pt-5">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Agenda — Próximos 7 dias
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-1 shrink-0"
            onClick={() => navigate('/cpg/legal?tab=agenda')}
          >
            Ver agenda
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        <ScrollArea className="w-full">
          <div className="flex gap-3 pb-3" style={{ minWidth: 'max-content' }}>
            {days.map((day) => {
              const key = format(day, 'yyyy-MM-dd');
              const dayAppts = appointmentsByDay.get(key) || [];
              const isToday = isSameDay(day, today);
              const label = getDayLabel(day, today);
              const dateStr = format(day, "dd/MM");

              return (
                <div
                  key={key}
                  className={`flex flex-col rounded-xl border w-[200px] shrink-0 ${
                    isToday
                      ? 'border-primary/40 bg-primary/5'
                      : 'border-border bg-muted/30'
                  }`}
                >
                  {/* Column header */}
                  <div className={`px-3 py-2.5 border-b rounded-t-xl ${
                    isToday ? 'bg-primary/10 border-primary/20' : 'bg-muted/50'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-semibold capitalize ${
                        isToday ? 'text-primary' : 'text-foreground'
                      }`}>
                        {label}
                      </span>
                      <span className="text-xs text-muted-foreground">{dateStr}</span>
                    </div>
                    {dayAppts.length > 0 && (
                      <Badge variant="secondary" className="mt-1 text-xs px-1.5 py-0">
                        {dayAppts.length} evento{dayAppts.length > 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>

                  {/* Column body */}
                  <div className="flex-1 p-2 space-y-2 min-h-[120px] max-h-[300px] overflow-y-auto">
                    {dayAppts.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-xs text-muted-foreground py-8">
                        Sem eventos
                      </div>
                    ) : (
                      dayAppts.map((apt) => (
                        <KanbanAppointmentCard key={apt.id} appointment={apt} />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function KanbanAppointmentCard({ appointment }: { appointment: UnifiedAppointment }) {
  const startTime = format(new Date(appointment.start_datetime), "HH:mm");
  const config = typeConfig[appointment.appointment_type] || typeConfig.reuniao;
  const IconComponent = config.icon;

  return (
    <div className={`p-2 rounded-lg border text-left ${config.bgColor} hover:shadow-sm transition-all`}>
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-xs font-bold text-primary bg-primary/10 rounded px-1.5 py-0.5">
          {startTime}
        </span>
        <Badge variant="outline" className={`text-[10px] px-1 py-0 ${config.color} border-current/20`}>
          {config.label}
        </Badge>
      </div>
      <div className="flex items-start gap-1.5">
        <IconComponent className={`h-3.5 w-3.5 ${config.color} shrink-0 mt-0.5`} />
        <span className="text-xs font-medium leading-tight line-clamp-2">
          {appointment.title}
        </span>
      </div>
      {appointment.client_name && (
        <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
          <Users className="h-3 w-3" />
          <span className="truncate">{appointment.client_name}</span>
        </div>
      )}
    </div>
  );
}
