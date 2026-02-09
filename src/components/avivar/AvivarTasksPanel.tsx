/**
 * AvivarTasksPanel - Painel de tarefas em 3 colunas: Atrasadas, Hoje, Amanhã
 * Tarefas concluídas não aparecem. Tarefas futuras (depois de amanhã) não aparecem.
 */

import { AlertTriangle, Clock, CalendarDays, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAvivarTasks } from '@/hooks/useAvivarTasks';
import { AvivarTaskCard } from './AvivarTaskCard';
import { isToday, isTomorrow, isPast, startOfDay } from 'date-fns';

export function AvivarTasksPanel() {
  const {
    pendingTasks,
    overdueTasks,
    isLoading,
    completeTask,
    deleteTask,
  } = useAvivarTasks();

  // Today tasks: due today (not overdue) + tasks with no date
  const todayTasks = pendingTasks.filter(t => {
    if (!t.due_at) return true; // sem data = hoje
    const d = new Date(t.due_at);
    return isToday(d) && !isPast(d);
  });

  // Tomorrow tasks only
  const tomorrowTasks = pendingTasks.filter(t => t.due_at && isTomorrow(new Date(t.due_at)));

  if (isLoading) {
    return (
      <Card className="h-full bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
        <CardContent className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(var(--avivar-primary))]"></div>
        </CardContent>
      </Card>
    );
  }

  const allEmpty = overdueTasks.length === 0 && todayTasks.length === 0 && tomorrowTasks.length === 0;

  if (allEmpty) {
    return (
      <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
        <CardContent className="flex flex-col items-center justify-center h-48 text-center">
          <CheckCircle2 className="h-12 w-12 text-emerald-500 mb-4" />
          <p className="font-medium text-[hsl(var(--avivar-foreground))]">Tudo em dia!</p>
          <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">
            Nenhuma tarefa pendente para os próximos dias
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Coluna: Atrasadas */}
      <TaskColumn
        title="Atrasadas"
        icon={<AlertTriangle className="h-4 w-4" />}
        count={overdueTasks.length}
        tasks={overdueTasks}
        emptyMessage="Nenhuma tarefa atrasada"
        variant="overdue"
        onComplete={(id) => completeTask.mutate(id)}
        onDelete={(id) => deleteTask.mutate(id)}
      />

      {/* Coluna: Hoje */}
      <TaskColumn
        title="Hoje"
        icon={<Clock className="h-4 w-4" />}
        count={todayTasks.length}
        tasks={todayTasks}
        emptyMessage="Nenhuma tarefa para hoje"
        variant="today"
        onComplete={(id) => completeTask.mutate(id)}
        onDelete={(id) => deleteTask.mutate(id)}
      />

      {/* Coluna: Amanhã */}
      <TaskColumn
        title="Amanhã"
        icon={<CalendarDays className="h-4 w-4" />}
        count={tomorrowTasks.length}
        tasks={tomorrowTasks}
        emptyMessage="Nenhuma tarefa para amanhã"
        variant="tomorrow"
        onComplete={(id) => completeTask.mutate(id)}
        onDelete={(id) => deleteTask.mutate(id)}
      />
    </div>
  );
}

interface TaskColumnProps {
  title: string;
  icon: React.ReactNode;
  count: number;
  tasks: any[];
  emptyMessage: string;
  variant: 'overdue' | 'today' | 'tomorrow';
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
}

function TaskColumn({ title, icon, count, tasks, emptyMessage, variant, onComplete, onDelete }: TaskColumnProps) {
  const borderColor = {
    overdue: 'border-t-red-500',
    today: 'border-t-amber-500',
    tomorrow: 'border-t-blue-500',
  }[variant];

  const badgeClass = {
    overdue: 'bg-red-500/20 text-red-400 border-red-500/30',
    today: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    tomorrow: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  }[variant];

  return (
    <Card className={`bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))] border-t-2 ${borderColor}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-[hsl(var(--avivar-foreground))]">
            {icon}
            {title}
          </CardTitle>
          <Badge className={badgeClass}>
            {count}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <p className="text-sm text-center py-8 text-[hsl(var(--avivar-muted-foreground))]">
            {emptyMessage}
          </p>
        ) : (
          <ScrollArea className="max-h-[calc(100vh-22rem)]">
            <div className="space-y-2 pr-1">
              {tasks.map(task => (
                <AvivarTaskCard
                  key={task.id}
                  task={task}
                  onComplete={onComplete}
                  onDelete={onDelete}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
