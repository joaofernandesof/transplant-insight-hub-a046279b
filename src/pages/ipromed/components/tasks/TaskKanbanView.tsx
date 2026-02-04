/**
 * Task Kanban View Component
 */

import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Calendar,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  CheckSquare,
  AlertTriangle,
  User,
} from "lucide-react";
import { format, isPast, isToday, isTomorrow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { Task, TaskStatus } from "../../IpromedTasks";

interface TaskKanbanViewProps {
  tasks: Task[];
  onOpenTask: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  statusConfig: Record<string, { label: string; color: string; dotColor: string }>;
  priorityConfig: Record<number, { label: string; color: string; icon: React.ElementType }>;
}

const columns: { id: TaskStatus; label: string; color: string }[] = [
  { id: "todo", label: "A Fazer", color: "border-t-slate-400" },
  { id: "in_progress", label: "Em Andamento", color: "border-t-blue-500" },
  { id: "in_review", label: "Em Revisão", color: "border-t-amber-500" },
  { id: "done", label: "Concluído", color: "border-t-emerald-500" },
];

export function TaskKanbanView({
  tasks,
  onOpenTask,
  onEditTask,
  onDeleteTask,
  onStatusChange,
  statusConfig,
  priorityConfig,
}: TaskKanbanViewProps) {
  const tasksByStatus = useMemo(() => {
    const grouped: Record<string, Task[]> = {
      todo: [],
      in_progress: [],
      in_review: [],
      done: [],
    };
    tasks.forEach((task) => {
      if (grouped[task.status]) {
        grouped[task.status].push(task);
      }
    });
    return grouped;
  }, [tasks]);

  const getDueDateInfo = (dueDate: string | null) => {
    if (!dueDate) return null;
    const date = new Date(dueDate);
    const isOverdue = isPast(date) && !isToday(date);
    const isDueToday = isToday(date);
    const isDueTomorrow = isTomorrow(date);

    return {
      text: isDueToday ? "Hoje" : isDueTomorrow ? "Amanhã" : format(date, "dd/MM", { locale: ptBR }),
      isOverdue,
      isDueToday,
      isDueTomorrow,
    };
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map((column) => (
        <div key={column.id} className="flex-shrink-0 w-[300px]">
          <Card className={cn("border-t-4", column.color)}>
            <div className="p-3 border-b bg-muted/30">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">{column.label}</h3>
                <Badge variant="secondary" className="text-xs">
                  {tasksByStatus[column.id].length}
                </Badge>
              </div>
            </div>
            <ScrollArea className="h-[calc(100vh-400px)] min-h-[400px]">
              <div className="p-2 space-y-2">
                {tasksByStatus[column.id].length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Nenhuma tarefa
                  </div>
                ) : (
                  tasksByStatus[column.id].map((task) => {
                    const dueDateInfo = getDueDateInfo(task.due_date);
                    const PriorityIcon = priorityConfig[task.priority]?.icon;

                    return (
                      <Card
                        key={task.id}
                        className={cn(
                          "p-3 cursor-pointer hover:shadow-md transition-all group",
                          task.priority === 3 && task.status !== "done" && "border-l-4 border-l-rose-500"
                        )}
                        onClick={() => onOpenTask(task)}
                      >
                        {/* Header with Priority & Menu */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-1.5 min-w-0 flex-1">
                            {PriorityIcon && (
                              <PriorityIcon
                                className={cn("h-3.5 w-3.5 shrink-0", priorityConfig[task.priority]?.color)}
                              />
                            )}
                            <span className="font-medium text-sm truncate">{task.title}</span>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onOpenTask(task); }}>
                                <Eye className="h-4 w-4 mr-2" /> Ver Detalhes
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEditTask(task); }}>
                                <Edit className="h-4 w-4 mr-2" /> Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => { e.stopPropagation(); onDeleteTask(task); }}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" /> Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* Category */}
                        {task.category && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                            <span className="truncate">{task.category}</span>
                          </div>
                        )}

                        {/* Tags */}
                        {task.tags && task.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {task.tags.slice(0, 2).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0">
                                #{tag}
                              </Badge>
                            ))}
                            {task.tags.length > 2 && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                +{task.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                        )}

                        {/* Footer */}
                        <div className="flex items-center justify-between mt-2 pt-2 border-t">
                          <div className="flex items-center gap-2">
                            {/* Due Date */}
                            {dueDateInfo && (
                              <div
                                className={cn(
                                  "flex items-center gap-1 text-xs",
                                  dueDateInfo.isOverdue && task.status !== "done"
                                    ? "text-rose-600 font-medium"
                                    : dueDateInfo.isDueToday
                                    ? "text-amber-600"
                                    : "text-muted-foreground"
                                )}
                              >
                                {dueDateInfo.isOverdue && task.status !== "done" ? (
                                  <AlertTriangle className="h-3 w-3" />
                                ) : (
                                  <Calendar className="h-3 w-3" />
                                )}
                                {dueDateInfo.text}
                              </div>
                            )}

                            {/* Subtasks */}
                            {task.subtasks_count ? (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <CheckSquare className="h-3 w-3" />
                                {task.subtasks_completed}/{task.subtasks_count}
                              </div>
                            ) : null}
                          </div>

                          {/* Assignee */}
                          {task.assigned_to_name && (
                            <div className="flex items-center gap-1">
                              <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-medium text-primary">
                                {task.assigned_to_name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .slice(0, 2)
                                  .join("")
                                  .toUpperCase()}
                              </div>
                            </div>
                          )}
                        </div>
                      </Card>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </Card>
        </div>
      ))}
    </div>
  );
}
