/**
 * Task List View Component
 */

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Calendar,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  CheckSquare,
  AlertTriangle,
  User,
  ArrowRight,
} from "lucide-react";
import { format, isPast, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { Task, TaskStatus } from "../../IpromedTasks";

interface TaskListViewProps {
  tasks: Task[];
  onOpenTask: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  statusConfig: Record<string, { label: string; color: string; dotColor: string }>;
  priorityConfig: Record<number, { label: string; color: string; icon: React.ElementType }>;
}

export function TaskListView({
  tasks,
  onOpenTask,
  onEditTask,
  onDeleteTask,
  onStatusChange,
  statusConfig,
  priorityConfig,
}: TaskListViewProps) {
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());

  const toggleTask = (taskId: string) => {
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedTasks(newSelected);
  };

  const toggleAll = () => {
    if (selectedTasks.size === tasks.length) {
      setSelectedTasks(new Set());
    } else {
      setSelectedTasks(new Set(tasks.map((t) => t.id)));
    }
  };

  const getNextStatus = (current: string): TaskStatus => {
    const flow: Record<string, TaskStatus> = {
      todo: "in_progress",
      in_progress: "in_review",
      in_review: "done",
      done: "todo",
    };
    return flow[current] || "todo";
  };

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40px]">
              <Checkbox
                checked={selectedTasks.size === tasks.length && tasks.length > 0}
                onCheckedChange={toggleAll}
              />
            </TableHead>
            <TableHead>Tarefa</TableHead>
            <TableHead className="w-[120px]">Status</TableHead>
            <TableHead className="w-[100px]">Prioridade</TableHead>
            <TableHead className="w-[120px]">Prazo</TableHead>
            <TableHead className="w-[150px]">Responsável</TableHead>
            <TableHead className="w-[80px]">Subtarefas</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                Nenhuma tarefa encontrada
              </TableCell>
            </TableRow>
          ) : (
            tasks.map((task) => {
              const status = statusConfig[task.status];
              const priority = priorityConfig[task.priority];
              const PriorityIcon = priority?.icon;
              const isOverdue = task.due_date && isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date)) && task.status !== "done";
              const isDueToday = task.due_date && isToday(new Date(task.due_date));

              return (
                <TableRow
                  key={task.id}
                  className={cn(
                    "cursor-pointer hover:bg-muted/50",
                    selectedTasks.has(task.id) && "bg-muted/30"
                  )}
                  onClick={() => onOpenTask(task)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedTasks.has(task.id)}
                      onCheckedChange={() => toggleTask(task.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {task.priority === 3 && task.status !== "done" && (
                          <div className="w-1 h-4 rounded-full bg-rose-500" />
                        )}
                        <span className={cn("font-medium", task.status === "done" && "line-through text-muted-foreground")}>
                          {task.title}
                        </span>
                      </div>
                      {task.category && (
                        <div className="text-xs text-muted-foreground">{task.category}</div>
                      )}
                      {task.tags && task.tags.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {task.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className={cn("h-7 gap-1 text-xs", status?.color)}>
                          <div className={cn("w-2 h-2 rounded-full", status?.dotColor)} />
                          {status?.label}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {Object.entries(statusConfig).map(([key, config]) => (
                          <DropdownMenuItem
                            key={key}
                            onClick={() => onStatusChange(task.id, key as TaskStatus)}
                            className={cn(task.status === key && "bg-muted")}
                          >
                            <div className={cn("w-2 h-2 rounded-full mr-2", config.dotColor)} />
                            {config.label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                  <TableCell>
                    {PriorityIcon && (
                      <div className={cn("flex items-center gap-1 text-sm", priority?.color)}>
                        <PriorityIcon className="h-3.5 w-3.5" />
                        {priority?.label}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {task.due_date ? (
                      <div
                        className={cn(
                          "flex items-center gap-1 text-sm",
                          isOverdue ? "text-rose-600 font-medium" : isDueToday ? "text-amber-600" : "text-muted-foreground"
                        )}
                      >
                        {isOverdue ? <AlertTriangle className="h-3.5 w-3.5" /> : <Calendar className="h-3.5 w-3.5" />}
                        {format(new Date(task.due_date), "dd/MM/yyyy", { locale: ptBR })}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {task.assigned_to_name ? (
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                          {task.assigned_to_name
                            .split(" ")
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join("")
                            .toUpperCase()}
                        </div>
                        <span className="text-sm truncate max-w-[100px]">{task.assigned_to_name}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {task.subtasks_count ? (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <CheckSquare className="h-3.5 w-3.5" />
                        {task.subtasks_completed}/{task.subtasks_count}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onOpenTask(task)}>
                          <Eye className="h-4 w-4 mr-2" /> Ver Detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEditTask(task)}>
                          <Edit className="h-4 w-4 mr-2" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onStatusChange(task.id, getNextStatus(task.status))}>
                          <ArrowRight className="h-4 w-4 mr-2" /> Avançar Status
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onDeleteTask(task)} className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </Card>
  );
}
