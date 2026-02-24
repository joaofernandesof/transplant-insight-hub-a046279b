/**
 * CPG Advocacia Médica - Workspace Task List
 * Lista detalhada de tarefas do colaborador logado com dados reais
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Star,
  Clock,
  AlertCircle,
  ChevronRight,
  CalendarDays,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, isToday, isTomorrow, isPast, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: number;
  due_date: string | null;
  assigned_to_name?: string;
  case_id?: string;
  contract_id?: string;
  case?: { case_number: string; title: string };
  contract?: { contract_number: string };
}

function formatDueDate(dueDate: string | null): { label: string; className: string } {
  if (!dueDate) return { label: 'Sem prazo', className: 'text-muted-foreground' };
  
  const date = new Date(dueDate);
  
  if (isPast(date) && !isToday(date)) {
    const days = Math.abs(differenceInDays(new Date(), date));
    return { 
      label: `${days} dia${days > 1 ? 's' : ''} em atraso`, 
      className: 'text-red-600 font-medium' 
    };
  }
  
  if (isToday(date)) {
    return { label: 'Hoje', className: 'text-amber-600 font-medium' };
  }
  
  if (isTomorrow(date)) {
    return { label: 'Amanhã', className: 'text-amber-500' };
  }
  
  const days = differenceInDays(date, new Date());
  if (days <= 7) {
    return { label: `${days} dias`, className: 'text-blue-600' };
  }
  
  return { 
    label: format(date, "dd/MM/yyyy", { locale: ptBR }), 
    className: 'text-muted-foreground' 
  };
}

const priorityConfig: Record<number, { label: string; color: string }> = {
  1: { label: 'Baixa', color: 'bg-slate-100 text-slate-600' },
  2: { label: 'Média', color: 'bg-amber-100 text-amber-700' },
  3: { label: 'Alta', color: 'bg-red-100 text-red-700' },
};

export function WorkspaceTaskList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['workspace-tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ipromed_legal_tasks')
        .select(`
          *,
          case:case_id(case_number, title),
          contract:contract_id(contract_number)
        `)
        .in('status', ['pending', 'in_progress'])
        .order('due_date', { ascending: true, nullsFirst: false })
        .order('priority', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as Task[];
    },
  });

  const completeMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from('ipromed_legal_tasks')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['ipromed-task-stats'] });
      toast({ title: 'Tarefa concluída!' });
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const pendingTasks = tasks || [];

  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Minhas Tarefas
        </CardTitle>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-1"
          onClick={() => navigate('/cpg/legal')}
        >
          Ver todas
          <ChevronRight className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {pendingTasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CalendarDays className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhuma tarefa pendente</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-3 gap-1"
              onClick={() => navigate('/cpg/legal')}
            >
              <Plus className="h-4 w-4" />
              Criar tarefa
            </Button>
          </div>
        ) : (
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {pendingTasks.map((task) => {
                const dueInfo = formatDueDate(task.due_date);
                const priority = priorityConfig[task.priority] || priorityConfig[1];
                const isOverdue = task.due_date && isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date));

                return (
                  <div
                    key={task.id}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg border transition-colors hover:bg-muted/50",
                      isOverdue && "border-red-200 bg-red-50/50"
                    )}
                  >
                    <Checkbox
                      className="mt-1 h-5 w-5"
                      onCheckedChange={() => completeMutation.mutate(task.id)}
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <a 
                          href="#" 
                          className="text-sm font-medium text-foreground hover:text-primary hover:underline truncate"
                          onClick={(e) => {
                            e.preventDefault();
                            navigate('/cpg/legal');
                          }}
                        >
                          {task.title}
                        </a>
                        {isOverdue && (
                          <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 flex-wrap">
                        {task.case && (
                          <Badge variant="outline" className="text-xs">
                            {task.case.case_number}
                          </Badge>
                        )}
                        {task.contract && (
                          <Badge variant="outline" className="text-xs">
                            Contrato #{task.contract.contract_number}
                          </Badge>
                        )}
                        <span className={cn("text-xs", dueInfo.className)}>
                          {dueInfo.label}
                        </span>
                      </div>
                    </div>

                    <Badge className={cn("text-xs shrink-0", priority.color)}>
                      {priority.label}
                    </Badge>
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
