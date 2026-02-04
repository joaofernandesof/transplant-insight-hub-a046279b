/**
 * IPROMED - Workspace Deadlines
 * Prazos próximos e vencidos do sistema
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle,
  Clock,
  ChevronRight,
  Gavel,
  FileSignature,
  CalendarCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, isToday, isPast, differenceInDays, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

interface Deadline {
  id: string;
  title: string;
  dueDate: string;
  type: 'case' | 'contract' | 'task';
  status: 'overdue' | 'today' | 'upcoming';
  reference?: string;
  navigateTo: string;
}

const statusConfig = {
  overdue: {
    bg: 'bg-red-50 border-red-200',
    badge: 'bg-red-500 text-white',
    badgeLabel: 'Atrasado',
    icon: AlertTriangle,
    iconColor: 'text-red-500',
  },
  today: {
    bg: 'bg-amber-50 border-amber-200',
    badge: 'bg-amber-500 text-white',
    badgeLabel: 'Hoje',
    icon: Clock,
    iconColor: 'text-amber-500',
  },
  upcoming: {
    bg: 'bg-blue-50 border-blue-200',
    badge: 'bg-blue-500 text-white',
    badgeLabel: 'Próximo',
    icon: CalendarCheck,
    iconColor: 'text-blue-500',
  },
};

const typeIcons = {
  case: Gavel,
  contract: FileSignature,
  task: Clock,
};

export function WorkspaceDeadlines() {
  const navigate = useNavigate();
  const today = new Date();
  const next7Days = addDays(today, 7);

  const { data: deadlines, isLoading } = useQuery({
    queryKey: ['workspace-deadlines'],
    queryFn: async () => {
      const allDeadlines: Deadline[] = [];

      // Fetch tasks with due dates
      const { data: tasks } = await supabase
        .from('ipromed_legal_tasks')
        .select('id, title, due_date, status')
        .in('status', ['pending', 'in_progress'])
        .not('due_date', 'is', null)
        .lte('due_date', next7Days.toISOString())
        .order('due_date', { ascending: true });

      tasks?.forEach(task => {
        const dueDate = new Date(task.due_date!);
        let status: 'overdue' | 'today' | 'upcoming' = 'upcoming';
        
        if (isPast(dueDate) && !isToday(dueDate)) {
          status = 'overdue';
        } else if (isToday(dueDate)) {
          status = 'today';
        }

        allDeadlines.push({
          id: task.id,
          title: task.title,
          dueDate: task.due_date!,
          type: 'task',
          status,
          navigateTo: '/ipromed/legal',
        });
      });

      // Fetch contracts expiring soon
      const { data: contracts } = await supabase
        .from('ipromed_contracts')
        .select('id, contract_number, end_date, status')
        .eq('status', 'active')
        .not('end_date', 'is', null)
        .lte('end_date', next7Days.toISOString())
        .order('end_date', { ascending: true });

      contracts?.forEach(contract => {
        const dueDate = new Date(contract.end_date!);
        let status: 'overdue' | 'today' | 'upcoming' = 'upcoming';
        
        if (isPast(dueDate) && !isToday(dueDate)) {
          status = 'overdue';
        } else if (isToday(dueDate)) {
          status = 'today';
        }

        allDeadlines.push({
          id: contract.id,
          title: `Contrato #${contract.contract_number} vence`,
          dueDate: contract.end_date!,
          type: 'contract',
          status,
          reference: contract.contract_number,
          navigateTo: '/ipromed/contracts',
        });
      });

      // Fetch appointments today
      const { data: appointments } = await supabase
        .from('ipromed_appointments')
        .select('id, title, start_datetime, status')
        .gte('start_datetime', today.toISOString())
        .lte('start_datetime', next7Days.toISOString())
        .neq('status', 'cancelled')
        .order('start_datetime', { ascending: true });

      appointments?.forEach(apt => {
        const dueDate = new Date(apt.start_datetime);
        let status: 'overdue' | 'today' | 'upcoming' = 'upcoming';
        
        if (isToday(dueDate)) {
          status = 'today';
        }

        allDeadlines.push({
          id: apt.id,
          title: apt.title,
          dueDate: apt.start_datetime,
          type: 'case',
          status,
          navigateTo: '/ipromed/agenda',
        });
      });

      // Sort: overdue first, then today, then upcoming
      const statusOrder = { overdue: 0, today: 1, upcoming: 2 };
      return allDeadlines.sort((a, b) => {
        const statusDiff = statusOrder[a.status] - statusOrder[b.status];
        if (statusDiff !== 0) return statusDiff;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }).slice(0, 8);
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
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const overdueCount = deadlines?.filter(d => d.status === 'overdue').length || 0;
  const todayCount = deadlines?.filter(d => d.status === 'today').length || 0;

  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Prazos
          </CardTitle>
          {(overdueCount > 0 || todayCount > 0) && (
            <p className="text-xs text-muted-foreground mt-1">
              {overdueCount > 0 && (
                <span className="text-red-600 font-medium">{overdueCount} atrasado{overdueCount > 1 ? 's' : ''}</span>
              )}
              {overdueCount > 0 && todayCount > 0 && ' • '}
              {todayCount > 0 && (
                <span className="text-amber-600">{todayCount} para hoje</span>
              )}
            </p>
          )}
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-1"
          onClick={() => navigate('/ipromed/agenda')}
        >
          Agenda
          <ChevronRight className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {!deadlines || deadlines.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <CalendarCheck className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhum prazo próximo</p>
          </div>
        ) : (
          <ScrollArea className="h-[240px]">
            <div className="space-y-2">
              {deadlines.map((deadline) => {
                const config = statusConfig[deadline.status];
                const TypeIcon = typeIcons[deadline.type];
                const StatusIcon = config.icon;

                return (
                  <div
                    key={`${deadline.type}-${deadline.id}`}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors hover:opacity-80",
                      config.bg
                    )}
                    onClick={() => navigate(deadline.navigateTo)}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <TypeIcon className={cn("h-4 w-4 shrink-0", config.iconColor)} />
                      <span className="text-sm font-medium text-foreground truncate">
                        {deadline.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(deadline.dueDate), "dd/MM", { locale: ptBR })}
                      </span>
                      <Badge className={cn("text-xs", config.badge)}>
                        {config.badgeLabel}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
