/**
 * CPG Advocacia Médica - Workspace Task List
 * 3 colunas por advogada, tarefas agrupadas por prazo
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext";
import { invalidateAllTaskQueries } from "../utils/invalidateTaskQueries";
import { logTaskActivity } from "../utils/logTaskActivity";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Plus,
  Clock,
  AlertCircle,
  ChevronRight,
  ChevronDown,
  CalendarDays,
  AlertTriangle,
  CheckCircle2,
  Undo2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { isToday, isTomorrow, isPast, differenceInDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";
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
  completed_at?: string | null;
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

interface PendingCompletion {
  taskId: string;
  timeoutId: ReturnType<typeof setTimeout>;
}

export function WorkspaceTaskList() {
  const navigate = useNavigate();
  const { user } = useUnifiedAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [pendingCompletions, setPendingCompletions] = useState<Map<string, PendingCompletion>>(new Map());
  const [expandedCompleted, setExpandedCompleted] = useState<Set<string>>(new Set());

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      pendingCompletions.forEach(pc => clearTimeout(pc.timeoutId));
    };
  }, []);

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

  // Fetch recently completed tasks (last 7 days)
  const { data: completedTasks = [] } = useQuery({
    queryKey: ['workspace-tasks-completed'],
    queryFn: async () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data, error } = await supabase
        .from('ipromed_legal_tasks')
        .select(`
          *,
          case:case_id(case_number, title),
          contract:contract_id(contract_number)
        `)
        .eq('status', 'completed')
        .gte('completed_at', sevenDaysAgo.toISOString())
        .order('completed_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as Task[];
    },
  });

  const completeMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const task = tasks.find(t => t.id === taskId);
      const { error } = await supabase
        .from('ipromed_legal_tasks')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', taskId);
      if (error) throw error;
      if (task) {
        logTaskActivity({
          accountId: user?.authUserId || user?.id || "",
          taskId,
          taskTitle: task.title,
          action: "completed",
          performedBy: user?.authUserId || user?.id,
          performedByName: user?.fullName || user?.email,
        });
      }
    },
    onSuccess: () => {
      invalidateAllTaskQueries(queryClient);
      queryClient.invalidateQueries({ queryKey: ["task-activity-log"] });
    },
  });

  const undoMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const task = tasks.find(t => t.id === taskId) || completedTasks.find(t => t.id === taskId);
      const { error } = await supabase
        .from('ipromed_legal_tasks')
        .update({ status: 'todo', completed_at: null })
        .eq('id', taskId);
      if (error) throw error;
      if (task) {
        logTaskActivity({
          accountId: user?.authUserId || user?.id || "",
          taskId,
          taskTitle: task.title,
          action: "restored",
          performedBy: user?.authUserId || user?.id,
          performedByName: user?.fullName || user?.email,
        });
      }
    },
    onSuccess: () => {
      invalidateAllTaskQueries(queryClient);
      queryClient.invalidateQueries({ queryKey: ["task-activity-log"] });
    },
  });
    },
  });

  const handleComplete = useCallback((taskId: string) => {
    // Optimistically hide the task
    setPendingCompletions(prev => {
      const next = new Map(prev);
      // Clear any existing timeout for this task
      if (next.has(taskId)) clearTimeout(next.get(taskId)!.timeoutId);

      const timeoutId = setTimeout(() => {
        // Actually complete the task after 3s
        completeMutation.mutate(taskId);
        setPendingCompletions(prev2 => {
          const next2 = new Map(prev2);
          next2.delete(taskId);
          return next2;
        });
      }, 3000);

      next.set(taskId, { taskId, timeoutId });
      return next;
    });

    toast({
      title: 'Tarefa concluída!',
      description: 'Você tem 3 segundos para desfazer.',
      action: (
        <Button
          variant="outline"
          size="sm"
          className="gap-1 shrink-0"
          onClick={() => handleUndo(taskId)}
        >
          <Undo2 className="h-3 w-3" />
          Desfazer
        </Button>
      ),
      duration: 3000,
    });
  }, []);

  const handleUndo = useCallback((taskId: string) => {
    setPendingCompletions(prev => {
      const next = new Map(prev);
      const pending = next.get(taskId);
      if (pending) {
        clearTimeout(pending.timeoutId);
        next.delete(taskId);
      }
      return next;
    });
    toast({ title: 'Ação desfeita', description: 'A tarefa foi restaurada.' });
  }, [toast]);

  const handleUndoCompleted = useCallback((taskId: string) => {
    undoMutation.mutate(taskId);
    toast({ title: 'Tarefa restaurada' });
  }, [undoMutation, toast]);

  const toggleExpandCompleted = (lawyerName: string) => {
    setExpandedCompleted(prev => {
      const next = new Set(prev);
      if (next.has(lawyerName)) next.delete(lawyerName);
      else next.add(lawyerName);
      return next;
    });
  };

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
  // Filter out tasks that are pending completion (optimistic hide)
  const visibleTasks = allTasks.filter(t => !pendingCompletions.has(t.id));

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
                const lawyerTasks = visibleTasks.filter(t => (t.assigned_to_name || 'Sem responsável') === name);
                const dateGroups = groupByDate(lawyerTasks);
                const overdueCount = dateGroups.overdue.length;
                const lawyerCompleted = completedTasks.filter(t => (t.assigned_to_name || 'Sem responsável') === name);
                const isExpanded = expandedCompleted.has(name);

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
                                    onComplete={(id) => handleComplete(id)}
                                    onSelect={setSelectedTask}
                                  />
                                ))}
                              </div>
                            </div>
                          );
                        })}

                        {/* Completed tasks collapsible */}
                        {lawyerCompleted.length > 0 && (
                          <Collapsible open={isExpanded} onOpenChange={() => toggleExpandCompleted(name)}>
                            <CollapsibleTrigger asChild>
                              <button className="flex items-center gap-1 w-full text-xs font-medium text-emerald-600 uppercase tracking-wide py-1 hover:text-emerald-700 transition-colors">
                                <CheckCircle2 className="h-3 w-3" />
                                Concluídas
                                <span className="opacity-60 ml-1">{lawyerCompleted.length}</span>
                                <ChevronDown className={cn("h-3 w-3 ml-auto transition-transform", isExpanded && "rotate-180")} />
                              </button>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <div className="space-y-1 mt-1">
                                {lawyerCompleted.map(task => (
                                  <CompletedTaskRow
                                    key={task.id}
                                    task={task}
                                    onUndo={handleUndoCompleted}
                                  />
                                ))}
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        )}
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
          invalidateAllTaskQueries(queryClient);
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

function CompletedTaskRow({ task, onUndo }: { task: Task; onUndo: (id: string) => void }) {
  const completedDate = task.completed_at
    ? format(new Date(task.completed_at), "dd/MM", { locale: ptBR })
    : '';

  return (
    <div className="flex items-center gap-2 p-2 rounded-md border border-dashed border-emerald-200 bg-emerald-50/30 dark:bg-emerald-950/10 dark:border-emerald-900/30 text-xs opacity-70 hover:opacity-100 transition-opacity group">
      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
      <span className="flex-1 min-w-0 truncate line-through text-muted-foreground">
        {task.title}
      </span>
      <span className="text-[10px] text-muted-foreground shrink-0">{completedDate}</span>
      <Button
        variant="ghost"
        size="icon"
        className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
        onClick={() => onUndo(task.id)}
        title="Desfazer conclusão"
      >
        <Undo2 className="h-3 w-3" />
      </Button>
    </div>
  );
}
