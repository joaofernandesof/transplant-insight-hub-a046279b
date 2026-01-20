import { format, isPast, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Check, Clock, AlertTriangle, MoreVertical, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CrmTask } from '@/hooks/useCrmTasks';

interface CrmTaskCardProps {
  task: CrmTask;
  onComplete: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  compact?: boolean;
}

const priorityConfig = {
  low: { label: 'Baixa', className: 'bg-muted text-muted-foreground' },
  medium: { label: 'Média', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
  high: { label: 'Alta', className: 'bg-destructive/10 text-destructive' },
};

export function CrmTaskCard({ task, onComplete, onDelete, compact = false }: CrmTaskCardProps) {
  const isCompleted = !!task.completed_at;
  const isOverdue = task.due_at && isPast(new Date(task.due_at)) && !isCompleted;
  const isDueToday = task.due_at && isToday(new Date(task.due_at));

  if (compact) {
    return (
      <div 
        className={cn(
          "flex items-center gap-2 p-2 rounded-md border",
          isCompleted && "opacity-50 bg-muted/50",
          isOverdue && "border-destructive/50 bg-destructive/5"
        )}
      >
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0"
          onClick={() => onComplete(task.id)}
          disabled={isCompleted}
        >
          <Check className={cn("h-4 w-4", isCompleted && "text-green-500")} />
        </Button>
        
        <div className="flex-1 min-w-0">
          <p className={cn("text-sm truncate", isCompleted && "line-through")}>
            {task.title}
          </p>
        </div>

        {task.due_at && (
          <span className={cn(
            "text-xs shrink-0",
            isOverdue ? "text-destructive" : isDueToday ? "text-amber-600" : "text-muted-foreground"
          )}>
            {format(new Date(task.due_at), "dd/MM HH:mm")}
          </span>
        )}
      </div>
    );
  }

  return (
    <Card className={cn(
      "p-3 transition-all",
      isCompleted && "opacity-60 bg-muted/30",
      isOverdue && "border-destructive/50 bg-destructive/5"
    )}>
      <div className="flex items-start gap-3">
        <Button
          variant="outline"
          size="icon"
          className={cn(
            "h-8 w-8 shrink-0 rounded-full",
            isCompleted && "bg-green-500 border-green-500 text-white"
          )}
          onClick={() => onComplete(task.id)}
          disabled={isCompleted}
        >
          <Check className="h-4 w-4" />
        </Button>

        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <p className={cn(
              "font-medium",
              isCompleted && "line-through text-muted-foreground"
            )}>
              {task.title}
            </p>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  onClick={() => onDelete(task.id)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {task.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {task.description}
            </p>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={priorityConfig[task.priority].className}>
              {priorityConfig[task.priority].label}
            </Badge>

            {task.due_at && (
              <div className={cn(
                "flex items-center gap-1 text-xs",
                isOverdue ? "text-destructive" : isDueToday ? "text-amber-600" : "text-muted-foreground"
              )}>
                {isOverdue ? (
                  <AlertTriangle className="h-3 w-3" />
                ) : (
                  <Clock className="h-3 w-3" />
                )}
                {format(new Date(task.due_at), "dd MMM 'às' HH:mm", { locale: ptBR })}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
