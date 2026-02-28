/**
 * CPG Advocacia Médica - Workspace Task List
 * 3 colunas por advogada, tarefas agrupadas por prazo
 */

import { useState } from "react";
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
  Clock,
  AlertCircle,
  ChevronRight,
  CalendarDays,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { isToday, isTomorrow, isPast, differenceInDays } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { TaskFormDialog } from "./tasks/TaskFormDialog";
import { TaskDetailDialog } from "./tasks/TaskDetailDialog";

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

type DateGroup = 'overdue' | 'today' | 'tomorrow' | 'upcoming' | 'nodate';

function getDateGroup(dueDate: string | null): DateGroup {
  if (!dueDate) return 'nodate';
  const date = new Date(dueDate);
  if (isPast(date) && !isToday(date)) return 'overdue';
  if (isToday(date)) return 'today';
  if (isTomorrow(date)) return 'tomorrow';
  return 'upcoming';
}

function formatDueLabel(dueDate: string | null): { label: string; className: string } {
  if (!dueDate) return { label: 'Sem prazo', className: 'text-muted-foreground' };
  const date = new Date(dueDate);
  if (isPast(date) && !isToday(date)) {
    const days = Math.abs(differenceInDays(new Date(), date));
    return { label: `${days}d atraso`, className: 'text-red-600 font-medium' };
  }
  if (isToday(date)) return { label: 'Hoje', className: 'text-amber-600 font-medium' };
  if (isTomorrow(date)) return { label: 'Amanhã', className: 'text-amber-500' };
  const days = differenceInDays(date, new Date());
  return { label: `${days}d`, className: 'text-blue-600' };
}

const priorityConfig: Record<number, { label: string; color: string }> = {
  1: { label: 'Baixa', color: 'bg-slate-100 text-slate-600' },
  2: { label: 'Média', color: 'bg-amber-100 text-amber-700' },
  3: { label: 'Alta', color: 'bg-red-100 text-red-700' },
};

const dateGroupConfig: Record<DateGroup, { label: string; icon: React.ReactNode; className: string }> = {
  overdue: { label: 'Atrasadas', icon: <AlertTriangle className="h-3 w-3" />, className: 'text-red-600' },
  today: { label: 'Hoje', icon: <Clock className="h-3 w-3" />, className: 'text-amber-600' },
  tomorrow: { label: 'Amanhã', icon: <CalendarDays className="h-3 w-3" />, className: 'text-blue-600' },
  upcoming: { label: 'Próximos dias', icon: <CalendarDays className="h-3 w-3" />, className: 'text-muted-foreground' },
  nodate: { label: 'Sem prazo', icon: null, className: 'text-muted-foreground' },
};

const GROUP_ORDER: DateGroup[] = ['overdue', 'today', 'tomorrow', 'upcoming', 'nodate'];

export function WorkspaceTaskList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

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
        .in('status', ['todo', 'pendente', 'in_progress', 'em_andamento', 'pending', 'in_review'])
        .order('due_date', { ascending: true, nullsFirst: false })
        .order('priority', { ascending: false })
        .limit(100);

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
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-5 w-32" />
              {[1, 2, 3].map((j) => <Skeleton key={j} className="h-12 w-full" />)}
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const allTasks = tasks || [];

  // Group by lawyer
  const lawyerNames = [...new Set(allTasks.map(t => t.assigned_to_name || 'Sem responsável'))].sort();
  
  // Group tasks per lawyer by date group
  function groupByDate(lawyerTasks: Task[]): Record<DateGroup, Task[]> {
    const groups: Record<DateGroup, Task[]> = { overdue: [], today: [], tomorrow: [], upcoming: [], nodate: [] };
    lawyerTasks.forEach(t => {
      groups[getDateGroup(t.due_date)].push(t);
    });
    return groups;
  }

  return (
    <>
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Tarefas da Equipe
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1" onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4" />
              Criar tarefa
            </Button>
            <Button variant="outline" size="sm" className="gap-1" onClick={() => navigate('/cpg/tasks')}>
              Ver todas
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {allTasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CalendarDays className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhuma tarefa pendente</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {lawyerNames.map(name => {
                const lawyerTasks = allTasks.filter(t => (t.assigned_to_name || 'Sem responsável') === name);
                const dateGroups = groupByDate(lawyerTasks);
                const overdueCount = dateGroups.overdue.length;

                return (
                  <div key={name} className="border rounded-lg overflow-hidden">
                    {/* Lawyer header */}
                    <div className="px-3 py-2 bg-muted/50 border-b flex items-center justify-between">
                      <span className="text-sm font-semibold truncate">{name}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {overdueCount > 0 && (
                          <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                            {overdueCount}
                          </Badge>
                        )}
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          {lawyerTasks.length}
                        </Badge>
                      </div>
                    </div>

                    {/* Grouped tasks */}
                    <ScrollArea className="h-[400px]">
                      <div className="p-2 space-y-3">
                        {GROUP_ORDER.map(group => {
                          const groupTasks = dateGroups[group];
                          if (groupTasks.length === 0) return null;
                          const config = dateGroupConfig[group];

                          return (
                            <div key={group}>
                              <div className={cn("flex items-center gap-1 mb-1.5 text-xs font-medium uppercase tracking-wide", config.className)}>
                                {config.icon}
                                {config.label}
                                <span className="ml-auto opacity-60">{groupTasks.length}</span>
                              </div>
                              <div className="space-y-1">
                                {groupTasks.map(task => (
                                  <TaskRow
                                    key={task.id}
                                    task={task}
                                    onComplete={(id) => completeMutation.mutate(id)}
                                    onSelect={setSelectedTask}
                                  />
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
      <TaskFormDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        task={null}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['workspace-tasks'] });
          queryClient.invalidateQueries({ queryKey: ['ipromed-task-stats'] });
          setShowCreateDialog(false);
        }}
      />
      <TaskDetailDialog
        task={selectedTask}
        open={!!selectedTask}
        onOpenChange={(open) => !open && setSelectedTask(null)}
      />
    </>
  );
}

function TaskRow({ task, onComplete, onSelect }: { task: Task; onComplete: (id: string) => void; onSelect: (t: Task) => void }) {
  const dueInfo = formatDueLabel(task.due_date);
  const priority = priorityConfig[task.priority] || priorityConfig[1];
  const isOverdue = task.due_date && isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date));

  return (
    <div
      className={cn(
        "flex items-center gap-2 p-2 rounded-md border text-xs transition-colors hover:bg-muted/50",
        isOverdue && "border-red-200 bg-red-50/30"
      )}
    >
      <Checkbox
        className="h-4 w-4 shrink-0"
        onCheckedChange={() => onComplete(task.id)}
      />
      <button
        className="flex-1 min-w-0 text-left truncate font-medium text-foreground hover:text-primary hover:underline"
        onClick={() => onSelect(task)}
      >
        {task.title}
      </button>
      {isOverdue && <AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />}
      <span className={cn("shrink-0", dueInfo.className)}>{dueInfo.label}</span>
      <Badge className={cn("text-[10px] shrink-0 px-1.5 py-0", priority.color)}>
        {priority.label}
      </Badge>
    </div>
  );
}
