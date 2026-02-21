/**
 * CPG Advocacia Médica - Workspace Agenda
 * Resumo da agenda do dia do colaborador logado
 * Sincronizado com o módulo de Agenda (AstreaStyleAgenda)
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  ChevronRight,
  Clock,
  MapPin,
  Video,
  Users,
  Plus,
  Gavel,
  Bell,
  CheckCircle2,
  Cake,
  Stethoscope,
} from "lucide-react";
import { format, isToday, isTomorrow, addDays, startOfDay, endOfDay, parseISO } from "date-fns";
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

// Configuração visual por tipo
const typeConfig: Record<string, { 
  label: string; 
  icon: React.ElementType; 
  color: string; 
  bgColor: string;
}> = {
  reuniao: { label: 'Reunião', icon: Users, color: 'text-sky-700', bgColor: 'bg-sky-50' },
  audiencia: { label: 'Audiência', icon: Gavel, color: 'text-violet-700', bgColor: 'bg-violet-50' },
  prazo: { label: 'Prazo', icon: Clock, color: 'text-rose-700', bgColor: 'bg-rose-50' },
  lembrete: { label: 'Lembrete', icon: Bell, color: 'text-amber-700', bgColor: 'bg-amber-50' },
  tarefa: { label: 'Tarefa', icon: CheckCircle2, color: 'text-emerald-700', bgColor: 'bg-emerald-50' },
  onboarding: { label: 'Onboarding', icon: Users, color: 'text-teal-700', bgColor: 'bg-teal-50' },
  apresentacao: { label: 'Apresentação', icon: Users, color: 'text-indigo-700', bgColor: 'bg-indigo-50' },
  acompanhamento: { label: 'Acompanhamento', icon: Users, color: 'text-cyan-700', bgColor: 'bg-cyan-50' },
  meeting: { label: 'Reunião', icon: Users, color: 'text-sky-700', bgColor: 'bg-sky-50' },
  aniversario: { label: '🎂 Aniversário', icon: Cake, color: 'text-pink-700', bgColor: 'bg-pink-50' },
  dia_especialidade: { label: '⚕️ Dia da Especialidade', icon: Stethoscope, color: 'text-emerald-700', bgColor: 'bg-emerald-50' },
};

export function WorkspaceAgenda() {
  const navigate = useNavigate();
  const today = startOfDay(new Date());
  const tomorrowEnd = endOfDay(addDays(today, 1));
  const todayStr = format(today, 'yyyy-MM-dd');
  const tomorrowStr = format(addDays(today, 1), 'yyyy-MM-dd');

  const { data: appointments, isLoading } = useQuery({
    queryKey: ['workspace-agenda-unified', todayStr],
    queryFn: async () => {
      const todayMMDD = format(today, 'MM-dd');
      const tomorrowMMDD = format(addDays(today, 1), 'MM-dd');

      // Buscar appointments regulares, client meetings, aniversários e dias de especialidade em paralelo
      const [regularRes, meetingsRes, clientsRes, specialtyDaysRes] = await Promise.all([
        supabase
          .from('ipromed_appointments')
          .select(`*, ipromed_legal_clients(name)`)
          .gte('start_datetime', today.toISOString())
          .lte('start_datetime', tomorrowEnd.toISOString())
          .neq('status', 'cancelled')
          .order('start_datetime', { ascending: true }),
        supabase
          .from('ipromed_client_meetings')
          .select(`*, ipromed_legal_clients(name)`)
          .gte('scheduled_date', todayStr)
          .lte('scheduled_date', tomorrowStr)
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

      // Transformar appointments para formato unificado
      const unifiedAppointments: UnifiedAppointment[] = (regularRes.data || []).map((apt: any) => ({
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
        source: 'appointment' as const,
      }));

      // Transformar client meetings para formato unificado
      const unifiedMeetings: UnifiedAppointment[] = (meetingsRes.data || []).map((meeting: any) => {
        const startDatetime = `${meeting.scheduled_date}T${meeting.scheduled_time || '09:00'}:00`;
        let endDatetime: string | null = null;
        
        if (meeting.duration_minutes) {
          const endDate = new Date(startDatetime);
          endDate.setMinutes(endDate.getMinutes() + meeting.duration_minutes);
          endDatetime = endDate.toISOString();
        }

        return {
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
          source: 'meeting' as const,
        };
      });

      // Gerar eventos de aniversário (hoje e amanhã)
      const birthdayEvents: UnifiedAppointment[] = [];
      const clients = clientsRes.data || [];
      
      for (const client of clients) {
        if (!client.birth_date) continue;
        const birthMMDD = client.birth_date.substring(5); // MM-DD
        
        let eventDate: string | null = null;
        if (birthMMDD === todayMMDD) {
          eventDate = todayStr;
        } else if (birthMMDD === tomorrowMMDD) {
          eventDate = tomorrowStr;
        }
        
        if (eventDate) {
          birthdayEvents.push({
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
            source: 'appointment' as const,
          });
        }
      }

      // Gerar eventos de dia da especialidade (hoje e amanhã)
      const specialtyEvents: UnifiedAppointment[] = [];
      const specialtyDays = specialtyDaysRes.data || [];
      const specialtyMap = new Map(specialtyDays.map(s => [s.specialty, s]));

      for (const client of clients) {
        if (!client.medical_specialty) continue;
        const specDay = specialtyMap.get(client.medical_specialty);
        if (!specDay) continue;

        let eventDate: string | null = null;
        if (specDay.celebration_date === todayMMDD) {
          eventDate = todayStr;
        } else if (specDay.celebration_date === tomorrowMMDD) {
          eventDate = tomorrowStr;
        }

        if (eventDate) {
          specialtyEvents.push({
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
            source: 'appointment' as const,
          });
        }
      }

      // Combinar e ordenar por data/hora
      const allAppointments = [...birthdayEvents, ...specialtyEvents, ...unifiedAppointments, ...unifiedMeetings];
      allAppointments.sort((a, b) => 
        new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime()
      );

      return allAppointments;
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const todayAppointments = appointments?.filter(apt => 
    isToday(new Date(apt.start_datetime))
  ) || [];

  const tomorrowAppointments = appointments?.filter(apt => 
    isTomorrow(new Date(apt.start_datetime))
  ) || [];

  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Agenda
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-1"
          onClick={() => navigate('/ipromed/legal?tab=agenda')}
        >
          Ver agenda
          <ChevronRight className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {todayAppointments.length === 0 && tomorrowAppointments.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Calendar className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhum compromisso agendado</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-3 gap-1"
              onClick={() => navigate('/ipromed/legal?tab=agenda')}
            >
              <Plus className="h-4 w-4" />
              Agendar
            </Button>
          </div>
        ) : (
          <ScrollArea className="h-[280px]">
            <div className="space-y-4">
              {/* Today's appointments */}
              {todayAppointments.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground uppercase mb-2">
                    Hoje ({todayAppointments.length})
                  </h4>
                  <div className="space-y-2">
                    {todayAppointments.map((apt) => (
                      <AppointmentCard key={apt.id} appointment={apt} />
                    ))}
                  </div>
                </div>
              )}

              {/* Tomorrow's appointments */}
              {tomorrowAppointments.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground uppercase mb-2">
                    Amanhã ({tomorrowAppointments.length})
                  </h4>
                  <div className="space-y-2">
                    {tomorrowAppointments.map((apt) => (
                      <AppointmentCard key={apt.id} appointment={apt} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

function AppointmentCard({ appointment }: { appointment: UnifiedAppointment }) {
  const startTime = format(new Date(appointment.start_datetime), "HH:mm");
  const endTime = appointment.end_datetime 
    ? format(new Date(appointment.end_datetime), "HH:mm") 
    : null;
  
  const config = typeConfig[appointment.appointment_type] || typeConfig.reuniao;
  const IconComponent = config.icon;

  return (
    <div className={`p-3 rounded-lg border ${config.bgColor} hover:shadow-sm transition-all`}>
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center bg-primary/10 rounded-lg px-2 py-1 min-w-[50px]">
          <span className="text-sm font-bold text-primary">{startTime}</span>
          {endTime && <span className="text-xs text-muted-foreground">{endTime}</span>}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <IconComponent className={`h-4 w-4 ${config.color} shrink-0`} />
            <h5 className="text-sm font-medium truncate">{appointment.title}</h5>
            <Badge variant="outline" className={`text-xs shrink-0 ${config.color}`}>
              {config.label}
            </Badge>
          </div>
          
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {appointment.client_name && (
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {appointment.client_name}
              </span>
            )}
            {appointment.is_virtual ? (
              <span className="flex items-center gap-1 text-primary">
                <Video className="h-3 w-3" />
                Virtual
              </span>
            ) : appointment.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {appointment.location}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
