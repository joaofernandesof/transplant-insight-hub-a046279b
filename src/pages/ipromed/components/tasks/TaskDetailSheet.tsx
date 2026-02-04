/**
 * Task Detail Sheet with Subtasks
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Calendar,
  Edit,
  Trash2,
  Plus,
  CheckSquare,
  Flag,
  User,
  Tag,
  Clock,
  ChevronDown,
  Loader2,
  X,
} from "lucide-react";
import { format, isPast, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Task, TaskStatus, Subtask } from "../../IpromedTasks";

interface TaskDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  statusConfig: Record<string, { label: string; color: string; dotColor: string }>;
  priorityConfig: Record<number, { label: string; color: string; icon: React.ElementType }>;
}

export function TaskDetailSheet({
  open,
  onOpenChange,
  task,
  onEdit,
  onDelete,
  onStatusChange,
  statusConfig,
  priorityConfig,
}: TaskDetailSheetProps) {
  const queryClient = useQueryClient();
  const [newSubtask, setNewSubtask] = useState("");

  // Fetch subtasks
  const { data: subtasks = [], isLoading: loadingSubtasks } = useQuery({
    queryKey: ["ipromed-subtasks", task?.id],
    queryFn: async () => {
      if (!task?.id) return [];
      const { data, error } = await supabase
        .from("ipromed_legal_subtasks")
        .select("*")
        .eq("task_id", task.id)
        .order("order_index", { ascending: true });
      if (error) throw error;
      return data as Subtask[];
    },
    enabled: !!task?.id,
  });

  // Add subtask mutation
  const addSubtaskMutation = useMutation({
    mutationFn: async (title: string) => {
      const { error } = await supabase.from("ipromed_legal_subtasks").insert({
        task_id: task?.id,
        title,
        order_index: subtasks.length,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ipromed-subtasks", task?.id] });
      queryClient.invalidateQueries({ queryKey: ["ipromed-subtasks-counts"] });
      setNewSubtask("");
    },
    onError: () => {
      toast.error("Erro ao adicionar subtarefa");
    },
  });

  // Toggle subtask mutation
  const toggleSubtaskMutation = useMutation({
    mutationFn: async ({ id, is_completed }: { id: string; is_completed: boolean }) => {
      const { error } = await supabase
        .from("ipromed_legal_subtasks")
        .update({
          is_completed,
          completed_at: is_completed ? new Date().toISOString() : null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ipromed-subtasks", task?.id] });
      queryClient.invalidateQueries({ queryKey: ["ipromed-subtasks-counts"] });
    },
  });

  // Delete subtask mutation
  const deleteSubtaskMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("ipromed_legal_subtasks")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ipromed-subtasks", task?.id] });
      queryClient.invalidateQueries({ queryKey: ["ipromed-subtasks-counts"] });
    },
  });

  if (!task) return null;

  const status = statusConfig[task.status];
  const priority = priorityConfig[task.priority];
  const PriorityIcon = priority?.icon;
  const isOverdue = task.due_date && isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date)) && task.status !== "done";
  const completedSubtasks = subtasks.filter((s) => s.is_completed).length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col">
        <SheetHeader className="p-6 pb-4 border-b">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1 flex-1 min-w-0">
              <SheetTitle className="text-lg pr-8">{task.title}</SheetTitle>
              {task.category && (
                <p className="text-sm text-muted-foreground">{task.category}</p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="outline" size="icon" onClick={() => { onEdit(task); onOpenChange(false); }}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => { onDelete(task); onOpenChange(false); }} className="text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            {/* Status & Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground font-medium">Status</label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-between", status?.color)}>
                      <div className="flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full", status?.dotColor)} />
                        {status?.label}
                      </div>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[180px]">
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
              </div>

              <div className="space-y-2">
                <label className="text-xs text-muted-foreground font-medium">Prioridade</label>
                <div className={cn("flex items-center gap-2 h-10 px-3 border rounded-md", priority?.color)}>
                  {PriorityIcon && <PriorityIcon className="h-4 w-4" />}
                  {priority?.label}
                </div>
              </div>
            </div>

            {/* Due Date */}
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Prazo
              </label>
              {task.due_date ? (
                <div className={cn(
                  "flex items-center gap-2 text-sm p-2 rounded border",
                  isOverdue ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-muted/50"
                )}>
                  <Clock className="h-4 w-4" />
                  {format(new Date(task.due_date), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  {isOverdue && <Badge variant="destructive" className="ml-auto text-xs">Atrasada</Badge>}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Sem prazo definido</p>
              )}
            </div>

            {/* Assignee */}
            {task.assigned_to_name && (
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                  <User className="h-3 w-3" /> Responsável
                </label>
                <div className="flex items-center gap-2 p-2 rounded border bg-muted/50">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                    {task.assigned_to_name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                  </div>
                  <span className="text-sm">{task.assigned_to_name}</span>
                </div>
              </div>
            )}

            {/* Description */}
            {task.description && (
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground font-medium">Descrição</label>
                <p className="text-sm whitespace-pre-wrap p-3 rounded border bg-muted/30">
                  {task.description}
                </p>
              </div>
            )}

            {/* Tags */}
            {task.tags && task.tags.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                  <Tag className="h-3 w-3" /> Tags
                </label>
                <div className="flex flex-wrap gap-1">
                  {task.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Subtasks */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                  <CheckSquare className="h-3 w-3" /> Subtarefas
                  {subtasks.length > 0 && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {completedSubtasks}/{subtasks.length}
                    </Badge>
                  )}
                </label>
              </div>

              {/* Add subtask */}
              <div className="flex gap-2">
                <Input
                  placeholder="Nova subtarefa..."
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newSubtask.trim()) {
                      addSubtaskMutation.mutate(newSubtask.trim());
                    }
                  }}
                />
                <Button
                  size="icon"
                  onClick={() => newSubtask.trim() && addSubtaskMutation.mutate(newSubtask.trim())}
                  disabled={addSubtaskMutation.isPending}
                >
                  {addSubtaskMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* Subtask list */}
              {loadingSubtasks ? (
                <div className="text-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                </div>
              ) : subtasks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma subtarefa
                </p>
              ) : (
                <div className="space-y-2">
                  {subtasks.map((subtask) => (
                    <div
                      key={subtask.id}
                      className={cn(
                        "flex items-center gap-3 p-2 rounded border group",
                        subtask.is_completed && "bg-muted/50"
                      )}
                    >
                      <Checkbox
                        checked={subtask.is_completed}
                        onCheckedChange={(checked) =>
                          toggleSubtaskMutation.mutate({ id: subtask.id, is_completed: !!checked })
                        }
                      />
                      <span
                        className={cn(
                          "flex-1 text-sm",
                          subtask.is_completed && "line-through text-muted-foreground"
                        )}
                      >
                        {subtask.title}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => deleteSubtaskMutation.mutate(subtask.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
