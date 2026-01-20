import { useState } from 'react';
import { Clock, CheckCircle2, AlertTriangle, ListTodo } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCrmTasks } from '@/hooks/useCrmTasks';
import { CrmTaskCard } from './CrmTaskCard';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function CrmTasksPanel() {
  const { tasks, pendingTasks, overdueTasks, isLoading, completeTask, deleteTask } = useCrmTasks();
  const [activeTab, setActiveTab] = useState('pending');

  const completedTasks = tasks.filter(t => t.completed_at);
  
  // Group pending tasks by date
  const todayTasks = pendingTasks.filter(t => t.due_at && isToday(new Date(t.due_at)));
  const tomorrowTasks = pendingTasks.filter(t => t.due_at && isTomorrow(new Date(t.due_at)));
  const noDateTasks = pendingTasks.filter(t => !t.due_at);
  const futureTasks = pendingTasks.filter(t => 
    t.due_at && 
    !isToday(new Date(t.due_at)) && 
    !isTomorrow(new Date(t.due_at)) &&
    !isPast(new Date(t.due_at))
  );

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <ListTodo className="h-5 w-5" />
            Rotina
          </CardTitle>
          {overdueTasks.length > 0 && (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="h-3 w-3" />
              {overdueTasks.length} atrasada{overdueTasks.length > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </CardHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="mx-4 grid grid-cols-2">
          <TabsTrigger value="pending" className="gap-1">
            <Clock className="h-4 w-4" />
            Pendentes ({pendingTasks.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="gap-1">
            <CheckCircle2 className="h-4 w-4" />
            Concluídas ({completedTasks.length})
          </TabsTrigger>
        </TabsList>

        <CardContent className="flex-1 pt-4">
          <TabsContent value="pending" className="m-0 h-full">
            {pendingTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center">
                <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
                <p className="font-medium">Tudo em dia!</p>
                <p className="text-sm text-muted-foreground">
                  Nenhuma tarefa pendente
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[calc(100vh-24rem)]">
                <div className="space-y-4 pr-4">
                  {/* Overdue */}
                  {overdueTasks.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-medium text-destructive uppercase tracking-wide flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Atrasadas
                      </h4>
                      {overdueTasks.map(task => (
                        <CrmTaskCard
                          key={task.id}
                          task={task}
                          onComplete={(id) => completeTask.mutate(id)}
                          onDelete={(id) => deleteTask.mutate(id)}
                        />
                      ))}
                    </div>
                  )}

                  {/* Today */}
                  {todayTasks.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Hoje
                      </h4>
                      {todayTasks.map(task => (
                        <CrmTaskCard
                          key={task.id}
                          task={task}
                          onComplete={(id) => completeTask.mutate(id)}
                          onDelete={(id) => deleteTask.mutate(id)}
                        />
                      ))}
                    </div>
                  )}

                  {/* Tomorrow */}
                  {tomorrowTasks.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Amanhã
                      </h4>
                      {tomorrowTasks.map(task => (
                        <CrmTaskCard
                          key={task.id}
                          task={task}
                          onComplete={(id) => completeTask.mutate(id)}
                          onDelete={(id) => deleteTask.mutate(id)}
                        />
                      ))}
                    </div>
                  )}

                  {/* Future */}
                  {futureTasks.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Próximos Dias
                      </h4>
                      {futureTasks.map(task => (
                        <CrmTaskCard
                          key={task.id}
                          task={task}
                          onComplete={(id) => completeTask.mutate(id)}
                          onDelete={(id) => deleteTask.mutate(id)}
                        />
                      ))}
                    </div>
                  )}

                  {/* No date */}
                  {noDateTasks.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Sem Data
                      </h4>
                      {noDateTasks.map(task => (
                        <CrmTaskCard
                          key={task.id}
                          task={task}
                          onComplete={(id) => completeTask.mutate(id)}
                          onDelete={(id) => deleteTask.mutate(id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="completed" className="m-0 h-full">
            {completedTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center">
                <ListTodo className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="font-medium">Nenhuma tarefa concluída</p>
                <p className="text-sm text-muted-foreground">
                  Suas tarefas finalizadas aparecerão aqui
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[calc(100vh-24rem)]">
                <div className="space-y-2 pr-4">
                  {completedTasks.slice(0, 20).map(task => (
                    <CrmTaskCard
                      key={task.id}
                      task={task}
                      onComplete={(id) => completeTask.mutate(id)}
                      onDelete={(id) => deleteTask.mutate(id)}
                      compact
                    />
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
}
