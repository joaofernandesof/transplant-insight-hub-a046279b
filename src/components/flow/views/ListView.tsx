/**
 * ListView - Visualização em lista/tabela das tarefas
 */

import { FlowTask } from "@/types/flow";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface ListViewProps {
  tasks: FlowTask[];
  isLoading: boolean;
  onTaskClick: (taskId: string) => void;
}

const priorityConfig = {
  low: { label: 'Baixa', className: 'bg-muted text-muted-foreground' },
  medium: { label: 'Média', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
  high: { label: 'Alta', className: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' },
  urgent: { label: 'Urgente', className: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
};

export function ListView({ tasks, isLoading, onTaskClick }: ListViewProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map(i => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Nenhuma tarefa encontrada. Crie sua primeira tarefa!
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead>Título</TableHead>
            <TableHead className="w-32">Responsável</TableHead>
            <TableHead className="w-32">Status</TableHead>
            <TableHead className="w-24">Prioridade</TableHead>
            <TableHead className="w-32">Vencimento</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map(task => (
            <TableRow 
              key={task.id} 
              className="cursor-pointer hover:bg-accent/50"
              onClick={() => onTaskClick(task.id)}
            >
              <TableCell onClick={(e) => e.stopPropagation()}>
                <Checkbox checked={!!task.completed_at} />
              </TableCell>
              <TableCell>
                <span className={cn(task.completed_at && "line-through text-muted-foreground")}>
                  {task.title}
                </span>
              </TableCell>
              <TableCell>
                {task.assignee ? (
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={task.assignee.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {task.assignee.full_name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm truncate max-w-20">
                      {task.assignee.full_name?.split(' ')[0]}
                    </span>
                  </div>
                ) : (
                  <span className="text-muted-foreground text-sm">—</span>
                )}
              </TableCell>
              <TableCell>
                {task.status && (
                  <Badge 
                    variant="outline"
                    style={{ 
                      borderColor: task.status.color,
                      color: task.status.color 
                    }}
                  >
                    {task.status.name}
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                <Badge className={priorityConfig[task.priority].className}>
                  {priorityConfig[task.priority].label}
                </Badge>
              </TableCell>
              <TableCell>
                {task.due_date ? (
                  <span className={cn(
                    "text-sm",
                    new Date(task.due_date) < new Date() && !task.completed_at && "text-destructive font-medium"
                  )}>
                    {format(new Date(task.due_date), "dd MMM", { locale: ptBR })}
                  </span>
                ) : (
                  <span className="text-muted-foreground text-sm">—</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
