/**
 * Widget de Tempo de Login das Advogadas
 * Calcula sessões baseadas em page_views consecutivos (gap > 30min = nova sessão)
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, User, Calendar } from "lucide-react";
import { format, differenceInMinutes, startOfDay, endOfDay, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// IDs das advogadas do portal CPG
const LAWYERS = [
  { id: '5ea64048-eb5e-4f2b-9f1e-f60c5494ff3f', name: 'Larissa', fullName: 'Dra. Larissa Guerreiro', color: 'bg-violet-500' },
  { id: 'ae05b3bb-5eab-4133-9bac-70066bd4b71e', name: 'Isabele', fullName: 'Isabele Cartaxo', color: 'bg-sky-500' },
  { id: '2bec7b54-9cd1-4be4-a8a6-c927167761f9', name: 'Caroline', fullName: 'Dra. Caroline Parahyba', color: 'bg-emerald-500' },
];

const SESSION_GAP_MINUTES = 30; // Gap entre page_views para considerar nova sessão

function formatDuration(totalMinutes: number): string {
  if (totalMinutes < 1) return '< 1min';
  const hours = Math.floor(totalMinutes / 60);
  const mins = Math.round(totalMinutes % 60);
  if (hours === 0) return `${mins}min`;
  return `${hours}h ${mins}min`;
}

interface LawyerSession {
  userId: string;
  name: string;
  fullName: string;
  color: string;
  totalMinutes: number;
  sessionCount: number;
  lastSeen: string | null;
}

export function LawyerLoginTimeWidget() {
  const [period, setPeriod] = useState("7");

  const { data: lawyerStats, isLoading } = useQuery({
    queryKey: ['lawyer-login-time', period],
    queryFn: async (): Promise<LawyerSession[]> => {
      const days = parseInt(period);
      const from = startOfDay(subDays(new Date(), days)).toISOString();
      const to = endOfDay(new Date()).toISOString();

      const results: LawyerSession[] = [];

      // Fetch events for all lawyers in parallel
      const promises = LAWYERS.map(async (lawyer) => {
        const { data: events } = await supabase
          .from('system_event_logs')
          .select('created_at, event_type')
          .eq('user_id', lawyer.id)
          .gte('created_at', from)
          .lte('created_at', to)
          .in('event_type', ['page_view', 'login', 'action'])
          .order('created_at', { ascending: true });

        if (!events || events.length === 0) {
          return {
            userId: lawyer.id,
            name: lawyer.name,
            fullName: lawyer.fullName,
            color: lawyer.color,
            totalMinutes: 0,
            sessionCount: 0,
            lastSeen: null,
          };
        }

        // Calculate sessions based on gaps between consecutive events
        let totalMinutes = 0;
        let sessionCount = 0;
        let sessionStart = new Date(events[0].created_at);
        let lastEvent = sessionStart;

        for (let i = 1; i < events.length; i++) {
          const current = new Date(events[i].created_at);
          const gap = differenceInMinutes(current, lastEvent);

          if (gap > SESSION_GAP_MINUTES) {
            // End previous session
            totalMinutes += differenceInMinutes(lastEvent, sessionStart);
            // Add minimum 1 min per session for single-event sessions
            if (differenceInMinutes(lastEvent, sessionStart) < 1) {
              totalMinutes += 1;
            }
            sessionCount++;
            // Start new session
            sessionStart = current;
          }
          lastEvent = current;
        }

        // Close last session
        totalMinutes += differenceInMinutes(lastEvent, sessionStart);
        if (differenceInMinutes(lastEvent, sessionStart) < 1) {
          totalMinutes += 1;
        }
        sessionCount++;

        const lastSeen = events[events.length - 1].created_at;

        return {
          userId: lawyer.id,
          name: lawyer.name,
          fullName: lawyer.fullName,
          color: lawyer.color,
          totalMinutes,
          sessionCount,
          lastSeen,
        };
      });

      return Promise.all(promises);
    },
    refetchInterval: 60000,
  });

  const maxMinutes = Math.max(...(lawyerStats?.map(l => l.totalMinutes) || [1]), 1);

  return (
    <Card className="border-none shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            Tempo de Login — Advogadas
          </CardTitle>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[130px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Hoje</SelectItem>
              <SelectItem value="7">7 dias</SelectItem>
              <SelectItem value="30">30 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          lawyerStats?.map((lawyer) => (
            <div key={lawyer.userId} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`h-8 w-8 rounded-full ${lawyer.color} flex items-center justify-center text-white text-xs font-bold`}>
                    {lawyer.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{lawyer.name}</p>
                    {lawyer.lastSeen && (
                      <p className="text-[10px] text-muted-foreground">
                        Último acesso: {format(new Date(lawyer.lastSeen), "dd/MM HH:mm", { locale: ptBR })}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">{formatDuration(lawyer.totalMinutes)}</p>
                  <p className="text-[10px] text-muted-foreground">{lawyer.sessionCount} sessões</p>
                </div>
              </div>
              {/* Progress bar */}
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full ${lawyer.color} rounded-full transition-all duration-500`}
                  style={{ width: `${Math.max((lawyer.totalMinutes / maxMinutes) * 100, 2)}%` }}
                />
              </div>
            </div>
          ))
        )}

        {!isLoading && lawyerStats?.every(l => l.totalMinutes === 0) && (
          <p className="text-xs text-muted-foreground text-center py-2">
            Nenhum acesso registrado no período
          </p>
        )}
      </CardContent>
    </Card>
  );
}
