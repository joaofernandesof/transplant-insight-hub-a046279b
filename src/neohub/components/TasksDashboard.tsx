import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CheckCircle2, Clock, AlertCircle, TrendingUp,
  Users, Target, Flame, Calendar, ArrowUp, ArrowDown,
  BarChart3, ListTodo, AlertTriangle
} from 'lucide-react';
import { format, isToday, isTomorrow, isPast, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Task, TaskStatus, TaskPriority } from '@/neohub/hooks/useNeoTeamTasks';

interface TasksDashboardProps {
  tasks: Task[];
  isManager?: boolean;
}

export function TasksDashboard({ tasks, isManager = false }: TasksDashboardProps) {
  const [selectedAssignee, setSelectedAssignee] = useState<string>('all');

  // Get unique assignees
  const assignees = useMemo(() => {
    const names = new Set<string>();
    tasks.forEach(t => {
      if (t.assignee_name) names.add(t.assignee_name);
    });
    return Array.from(names).sort();
  }, [tasks]);

  // Filter tasks by assignee
  const filteredTasks = useMemo(() => {
    if (selectedAssignee === 'all') return tasks;
    return tasks.filter(t => t.assignee_name === selectedAssignee);
  }, [tasks, selectedAssignee]);

  // Calculate stats - Updated for 4 statuses
  const stats = useMemo(() => {
    const total = filteredTasks.length;
    const done = filteredTasks.filter(t => t.status === 'done').length;
    const inProgress = filteredTasks.filter(t => t.status === 'in_progress').length;
    const todo = filteredTasks.filter(t => t.status === 'todo').length;
    const cancelled = filteredTasks.filter(t => t.status === 'cancelled').length;
    const overdue = filteredTasks.filter(t => 
      t.due_date && isPast(new Date(t.due_date)) && t.status !== 'done' && t.status !== 'cancelled'
    ).length;
    const urgent = filteredTasks.filter(t => 
      t.priority === 'urgent' && t.status !== 'done' && t.status !== 'cancelled'
    ).length;
    const dueToday = filteredTasks.filter(t => 
      t.due_date && isToday(new Date(t.due_date)) && t.status !== 'done' && t.status !== 'cancelled'
    ).length;
    const dueTomorrow = filteredTasks.filter(t => 
      t.due_date && isTomorrow(new Date(t.due_date)) && t.status !== 'done' && t.status !== 'cancelled'
    ).length;
    
    const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;
    
    return {
      total, done, inProgress, todo, cancelled, overdue, urgent, dueToday, dueTomorrow, completionRate
    };
  }, [filteredTasks]);

  // Get priority breakdown - exclude cancelled
  const priorityBreakdown = useMemo(() => {
    const pending = filteredTasks.filter(t => t.status !== 'done' && t.status !== 'cancelled');
    return {
      urgent: pending.filter(t => t.priority === 'urgent').length,
      high: pending.filter(t => t.priority === 'high').length,
      medium: pending.filter(t => t.priority === 'medium').length,
      low: pending.filter(t => t.priority === 'low').length,
    };
  }, [filteredTasks]);

  // Get upcoming deadlines - exclude cancelled
  const upcomingDeadlines = useMemo(() => {
    return filteredTasks
      .filter(t => t.due_date && t.status !== 'done' && t.status !== 'cancelled')
      .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
      .slice(0, 5);
  }, [filteredTasks]);

  // Performance by assignee (for manager view)
  const assigneePerformance = useMemo(() => {
    if (!isManager) return [];
    
    const perfMap = new Map<string, { total: number; done: number; overdue: number; cancelled: number }>();
    
    tasks.forEach(task => {
      const name = task.assignee_name || 'Não atribuído';
      const current = perfMap.get(name) || { total: 0, done: 0, overdue: 0, cancelled: 0 };
      current.total++;
      if (task.status === 'done') current.done++;
      if (task.status === 'cancelled') current.cancelled++;
      if (task.due_date && isPast(new Date(task.due_date)) && task.status !== 'done' && task.status !== 'cancelled') {
        current.overdue++;
      }
      perfMap.set(name, current);
    });
    
    return Array.from(perfMap.entries())
      .map(([name, data]) => ({
        name,
        ...data,
        completionRate: data.total > 0 ? Math.round((data.done / data.total) * 100) : 0
      }))
      .sort((a, b) => b.total - a.total);
  }, [tasks, isManager]);

  return (
    <div className="space-y-6">
      {/* Manager Filter */}
      {isManager && assignees.length > 0 && (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium">Filtrar por responsável:</span>
          </div>
          <Select value={selectedAssignee} onValueChange={setSelectedAssignee}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Todos os colaboradores" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os colaboradores</SelectItem>
              {assignees.map(name => (
                <SelectItem key={name} value={name}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <ListTodo className="h-5 w-5 text-primary" />
              </div>
              <Badge variant="secondary">{stats.total}</Badge>
            </div>
            <p className="text-2xl font-bold">{stats.todo}</p>
            <p className="text-sm text-muted-foreground">Tarefas a fazer</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <Badge variant="secondary">{stats.inProgress}</Badge>
            </div>
            <p className="text-2xl font-bold">{stats.dueToday}</p>
            <p className="text-sm text-muted-foreground">Vencem hoje</p>
          </CardContent>
        </Card>

        <Card className={stats.overdue > 0 ? 'border-destructive' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              {stats.overdue > 0 && <Badge variant="destructive">Atenção</Badge>}
            </div>
            <p className="text-2xl font-bold text-destructive">{stats.overdue}</p>
            <p className="text-sm text-muted-foreground">Em atraso</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30">
                {stats.completionRate}%
              </Badge>
            </div>
            <p className="text-2xl font-bold text-emerald-600">{stats.done}</p>
            <p className="text-sm text-muted-foreground">Concluídas</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress & Priority Breakdown */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Progresso Geral
            </CardTitle>
            <CardDescription>Taxa de conclusão das tarefas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{stats.done} de {stats.total} tarefas concluídas</span>
                <span className="font-bold">{stats.completionRate}%</span>
              </div>
              <Progress value={stats.completionRate} className="h-3" />
            </div>
            
            <div className="grid grid-cols-4 gap-4 pt-4 border-t">
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-600">{stats.todo}</p>
                <p className="text-xs text-muted-foreground">A Fazer</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-amber-600">{stats.inProgress}</p>
                <p className="text-xs text-muted-foreground">Em Andamento</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-600">{stats.done}</p>
                <p className="text-xs text-muted-foreground">Concluído</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
                <p className="text-xs text-muted-foreground">Cancelados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Priority Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              Prioridades Pendentes
            </CardTitle>
            <CardDescription>Distribuição por nível de urgência</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="font-medium">Urgente</span>
              </div>
              <Badge variant="destructive">{priorityBreakdown.urgent}</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20">
              <div className="flex items-center gap-2">
                <ArrowUp className="h-4 w-4 text-orange-500" />
                <span className="font-medium">Alta</span>
              </div>
              <Badge className="bg-orange-100 text-orange-600 hover:bg-orange-100">{priorityBreakdown.high}</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <div className="flex items-center gap-2">
                <ArrowDown className="h-4 w-4 text-blue-500" />
                <span className="font-medium">Normal</span>
              </div>
              <Badge className="bg-blue-100 text-blue-600 hover:bg-blue-100">{priorityBreakdown.medium}</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900/30">
              <div className="flex items-center gap-2">
                <ArrowDown className="h-4 w-4 text-slate-500" />
                <span className="font-medium">Baixa</span>
              </div>
              <Badge variant="secondary">{priorityBreakdown.low}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Deadlines & Team Performance */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upcoming Deadlines */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              Próximos Prazos
            </CardTitle>
            <CardDescription>Tarefas com vencimento próximo</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingDeadlines.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma tarefa com prazo definido
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingDeadlines.map(task => {
                  const dueDate = new Date(task.due_date!);
                  const isOverdue = isPast(dueDate);
                  const daysLeft = differenceInDays(dueDate, new Date());
                  
                  return (
                    <div 
                      key={task.id} 
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        isOverdue ? 'bg-destructive/10' : 
                        daysLeft <= 1 ? 'bg-amber-50 dark:bg-amber-900/20' :
                        'bg-muted/50'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{task.title}</p>
                        {task.assignee_name && (
                          <p className="text-xs text-muted-foreground">{task.assignee_name}</p>
                        )}
                      </div>
                      <Badge 
                        variant={isOverdue ? 'destructive' : daysLeft <= 1 ? 'secondary' : 'outline'}
                        className={daysLeft <= 1 && !isOverdue ? 'bg-amber-100 text-amber-600' : ''}
                      >
                        {isOverdue ? 'Atrasado' :
                         daysLeft === 0 ? 'Hoje' :
                         daysLeft === 1 ? 'Amanhã' :
                         `${daysLeft} dias`}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Team Performance (Manager Only) */}
        {isManager && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-500" />
                Performance da Equipe
              </CardTitle>
              <CardDescription>Desempenho por colaborador</CardDescription>
            </CardHeader>
            <CardContent>
              {assigneePerformance.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum colaborador atribuído
                </div>
              ) : (
                <div className="space-y-4">
                  {assigneePerformance.slice(0, 5).map(perf => (
                    <div key={perf.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm truncate">{perf.name}</span>
                        <div className="flex items-center gap-2">
                          {perf.overdue > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {perf.overdue} atrasado
                            </Badge>
                          )}
                          <span className="text-sm text-muted-foreground">
                            {perf.done}/{perf.total}
                          </span>
                        </div>
                      </div>
                      <Progress value={perf.completionRate} className="h-2" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
