/**
 * 🔔 Painel de Tarefas Operacionais
 * Tarefas vencendo hoje, atrasadas, agrupadas por responsável
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Bell, CheckCircle2, Clock, AlertTriangle, User } from 'lucide-react';
import { useAllSurgeryTasks } from '../hooks/useSurgeryTasks';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function SurgeryTasksPanel() {
  const { todayTasks, overdueTasks, byResponsible, isLoading, completeTask } = useAllSurgeryTasks();

  if (isLoading) return null;

  const totalActive = todayTasks.length + overdueTasks.length;
  if (totalActive === 0) return null;

  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Bell className="h-4 w-4 text-primary" />
          Tarefas Operacionais
          <Badge variant="destructive" className="ml-auto text-xs">
            {totalActive} {totalActive === 1 ? 'pendente' : 'pendentes'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overdue Section */}
        {overdueTasks.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-destructive flex items-center gap-1.5 mb-2">
              <AlertTriangle className="h-3.5 w-3.5" />
              ATRASADAS ({overdueTasks.length})
            </h4>
            <div className="space-y-1.5">
              {overdueTasks.slice(0, 10).map((task: any) => (
                <TaskRow key={task.id} task={task} onComplete={() => completeTask(task.id)} />
              ))}
            </div>
          </div>
        )}

        {overdueTasks.length > 0 && todayTasks.length > 0 && <Separator />}

        {/* Today Section */}
        {todayTasks.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-primary flex items-center gap-1.5 mb-2">
              <Clock className="h-3.5 w-3.5" />
              VENCENDO HOJE ({todayTasks.length})
            </h4>
            <div className="space-y-1.5">
              {todayTasks.map((task: any) => (
                <TaskRow key={task.id} task={task} onComplete={() => completeTask(task.id)} />
              ))}
            </div>
          </div>
        )}

        {/* By Responsible Summary */}
        {byResponsible.size > 0 && (
          <>
            <Separator />
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground mb-2">POR RESPONSÁVEL</h4>
              <div className="flex flex-wrap gap-2">
                {Array.from(byResponsible.entries()).map(([name, tasks]) => {
                  const overdueCount = tasks.filter((t: any) => t.status === 'overdue').length;
                  return (
                    <Badge
                      key={name}
                      variant="outline"
                      className={cn(
                        'gap-1.5 py-1',
                        overdueCount > 0 && 'border-destructive text-destructive'
                      )}
                    >
                      <User className="h-3 w-3" />
                      {name}
                      <span className="font-bold">{tasks.length}</span>
                      {overdueCount > 0 && (
                        <span className="text-destructive">({overdueCount} atras.)</span>
                      )}
                    </Badge>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function TaskRow({ task, onComplete }: { task: any; onComplete: () => void }) {
  return (
    <div className={cn(
      'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-all',
      task.status === 'overdue' && 'border-destructive/30 bg-destructive/5',
      task.status === 'active' && 'border-primary/30 bg-primary/5',
    )}>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0 rounded-full hover:bg-status-great/15"
        onClick={(e) => { e.stopPropagation(); onComplete(); }}
      >
        <CheckCircle2 className="h-4 w-4 text-muted-foreground hover:text-status-great" />
      </Button>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-xs truncate">{task.title}</p>
        <p className="text-[10px] text-muted-foreground truncate">
          {task.patient_name} • {task.responsible_name}
          {task.scheduled_date && (
            <> • {format(parseISO(task.scheduled_date), "dd/MM", { locale: ptBR })}</>
          )}
        </p>
      </div>
      <Badge
        variant="outline"
        className={cn(
          'text-[10px] shrink-0',
          task.status === 'overdue' && 'bg-destructive/10 text-destructive border-destructive/30',
          task.status === 'active' && 'bg-primary/10 text-primary border-primary/30',
        )}
      >
        {task.phase_label}
      </Badge>
    </div>
  );
}
