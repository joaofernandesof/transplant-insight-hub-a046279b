/**
 * TaskDetailSheet - Painel lateral com detalhes da tarefa
 */

import { useFlowTasks, useFlowComments } from "@/hooks/flow";
import { FlowProjectStatus, FlowTaskPriority } from "@/types/flow";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  CalendarIcon, 
  Trash2, 
  CheckCircle2, 
  Circle,
  Send,
  Loader2
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface TaskDetailSheetProps {
  taskId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  statuses: FlowProjectStatus[];
}

const priorities: { value: FlowTaskPriority; label: string }[] = [
  { value: 'low', label: 'Baixa' },
  { value: 'medium', label: 'Média' },
  { value: 'high', label: 'Alta' },
  { value: 'urgent', label: 'Urgente' },
];

export function TaskDetailSheet({ 
  taskId, 
  open, 
  onOpenChange, 
  projectId,
  statuses 
}: TaskDetailSheetProps) {
  const { useTask, updateTask, completeTask, deleteTask } = useFlowTasks(projectId);
  const { data: task, isLoading } = useTask(taskId || undefined);
  const { comments, addComment, isAdding } = useFlowComments(taskId || undefined);
  
  const [newComment, setNewComment] = useState("");

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    addComment(newComment.trim(), {
      onSuccess: () => setNewComment(""),
    });
  };

  const handleDelete = () => {
    if (!taskId || !confirm("Tem certeza que deseja excluir esta tarefa?")) return;
    deleteTask(taskId);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[500px] sm:max-w-[500px] p-0 flex flex-col">
        {isLoading || !task ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-20" />
            <Skeleton className="h-40" />
          </div>
        ) : (
          <>
            <SheetHeader className="p-6 pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => completeTask({ 
                      taskId: task.id, 
                      completed: !task.completed_at 
                    })}
                  >
                    {task.completed_at ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </Button>
                  <SheetTitle className={cn(
                    "text-xl",
                    task.completed_at && "line-through text-muted-foreground"
                  )}>
                    {task.title}
                  </SheetTitle>
                </div>
                <Button variant="ghost" size="icon" onClick={handleDelete}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </SheetHeader>

            <ScrollArea className="flex-1 px-6">
              <div className="space-y-6 pb-6">
                {/* Properties */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Status</Label>
                    <Select 
                      value={task.status_id || ""} 
                      onValueChange={(v) => updateTask({ id: task.id, status_id: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statuses.map(status => (
                          <SelectItem key={status.id} value={status.id}>
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-2 h-2 rounded-full" 
                                style={{ backgroundColor: status.color }}
                              />
                              {status.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Prioridade</Label>
                    <Select 
                      value={task.priority} 
                      onValueChange={(v) => updateTask({ id: task.id, priority: v as FlowTaskPriority })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {priorities.map(p => (
                          <SelectItem key={p.value} value={p.value}>
                            {p.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 col-span-2">
                    <Label className="text-xs text-muted-foreground">Data de Vencimento</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !task.due_date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {task.due_date 
                            ? format(new Date(task.due_date), "PPP", { locale: ptBR }) 
                            : "Sem data"
                          }
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={task.due_date ? new Date(task.due_date) : undefined}
                          onSelect={(date) => updateTask({ 
                            id: task.id, 
                            due_date: date?.toISOString().split('T')[0] 
                          })}
                          locale={ptBR}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <Separator />

                {/* Description */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Descrição</Label>
                  <Textarea
                    placeholder="Adicione uma descrição..."
                    value={task.description || ""}
                    onChange={(e) => updateTask({ id: task.id, description: e.target.value })}
                    rows={4}
                    className="resize-none"
                  />
                </div>

                <Separator />

                {/* Comments */}
                <div className="space-y-4">
                  <Label className="text-xs text-muted-foreground">
                    Comentários ({comments.length})
                  </Label>

                  <div className="space-y-3">
                    {comments.map(comment => (
                      <div key={comment.id} className="flex gap-3">
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarImage src={comment.author?.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">
                            {comment.author?.full_name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium">
                              {comment.author?.full_name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(comment.created_at), { 
                                addSuffix: true, 
                                locale: ptBR 
                              })}
                            </span>
                          </div>
                          <p className="text-sm">{comment.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Comment */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Adicionar comentário..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleAddComment()}
                    />
                    <Button 
                      size="icon" 
                      onClick={handleAddComment}
                      disabled={!newComment.trim() || isAdding}
                    >
                      {isAdding ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </ScrollArea>

            {/* Footer */}
            <div className="p-4 border-t text-xs text-muted-foreground">
              Criado em {format(new Date(task.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
