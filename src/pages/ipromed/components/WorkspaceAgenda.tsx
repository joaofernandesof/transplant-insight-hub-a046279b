/**
 * IPROMED - Workspace Agenda
 * Resumo da agenda do dia do colaborador logado
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, isToday, isTomorrow, addDays, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

interface Appointment {
  id: string;
  title: string;
  start_datetime: string;
  end_datetime: string;
  location?: string;
  is_virtual: boolean | null;
  meeting_url?: string;
  status: string;
  appointment_type?: string | null;
  client?: { name: string } | null;
}

const typeLabels: Record<string, string> = {
  meeting: 'Reunião',
  hearing: 'Audiência',
  consultation: 'Consulta',
  deadline: 'Prazo',
  other: 'Outro',
};

export function WorkspaceAgenda() {
  const navigate = useNavigate();
  const today = startOfDay(new Date());
  const tomorrow = endOfDay(addDays(today, 1));

  const { data: appointments, isLoading } = useQuery({
    queryKey: ['workspace-agenda'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ipromed_appointments')
        .select(`
          *,
          client:client_id(name)
        `)
        .gte('start_datetime', today.toISOString())
        .lte('start_datetime', tomorrow.toISOString())
        .neq('status', 'cancelled')
        .order('start_datetime', { ascending: true });

      if (error) throw error;
      return data as Appointment[];
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
          onClick={() => navigate('/ipromed/agenda')}
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
              onClick={() => navigate('/ipromed/agenda')}
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

function AppointmentCard({ appointment }: { appointment: Appointment }) {
  const startTime = format(new Date(appointment.start_datetime), "HH:mm");
  const endTime = format(new Date(appointment.end_datetime), "HH:mm");
  const typeLabel = typeLabels[appointment.appointment_type || 'other'] || 'Evento';

  return (
    <div className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center bg-primary/10 rounded-lg px-2 py-1 min-w-[50px]">
          <span className="text-sm font-bold text-primary">{startTime}</span>
          <span className="text-xs text-muted-foreground">{endTime}</span>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h5 className="text-sm font-medium truncate">{appointment.title}</h5>
            <Badge variant="outline" className="text-xs shrink-0">
              {typeLabel}
            </Badge>
          </div>
          
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {appointment.client && (
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {appointment.client.name}
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
