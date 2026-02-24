/**
 * Dialog de detalhes da tarefa
 */

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CalendarDays, User, FolderOpen, FileText, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: number;
  due_date: string | null;
  assigned_to_name?: string;
  case_id?: string;
  contract_id?: string;
  case?: { case_number: string; title: string };
  contract?: { contract_number: string };
}

const priorityConfig: Record<number, { label: string; color: string }> = {
  1: { label: 'Baixa', color: 'bg-slate-100 text-slate-600' },
  2: { label: 'Média', color: 'bg-amber-100 text-amber-700' },
  3: { label: 'Alta', color: 'bg-red-100 text-red-700' },
};

const statusLabels: Record<string, string> = {
  todo: 'A fazer',
  pendente: 'Pendente',
  in_progress: 'Em andamento',
  em_andamento: 'Em andamento',
  pending: 'Pendente',
  in_review: 'Em revisão',
  completed: 'Concluída',
};

interface TaskDetailDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskDetailDialog({ task, open, onOpenChange }: TaskDetailDialogProps) {
  if (!task) return null;

  const priority = priorityConfig[task.priority] || priorityConfig[1];
  const isOverdue = task.due_date && new Date(task.due_date) < new Date();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            {isOverdue && <AlertCircle className="h-5 w-5 text-destructive shrink-0" />}
            {task.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status & Priority */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline">{statusLabels[task.status] || task.status}</Badge>
            <Badge className={cn("text-xs", priority.color)}>{priority.label}</Badge>
          </div>

          {/* Description */}
          {task.description && (
            <>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground mb-1 font-medium">Descrição</p>
                <p className="text-sm whitespace-pre-wrap">{task.description}</p>
              </div>
            </>
          )}

          <Separator />

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            {/* Due date */}
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground text-xs">Prazo</p>
                <p className={cn("font-medium", isOverdue && "text-destructive")}>
                  {task.due_date
                    ? format(new Date(task.due_date), "dd/MM/yyyy", { locale: ptBR })
                    : "Sem prazo"}
                </p>
              </div>
            </div>

            {/* Assigned */}
            {task.assigned_to_name && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground text-xs">Responsável</p>
                  <p className="font-medium">{task.assigned_to_name}</p>
                </div>
              </div>
            )}

            {/* Case */}
            {task.case && (
              <div className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground text-xs">Processo</p>
                  <p className="font-medium">{task.case.case_number}</p>
                  {task.case.title && (
                    <p className="text-xs text-muted-foreground">{task.case.title}</p>
                  )}
                </div>
              </div>
            )}

            {/* Contract */}
            {task.contract && (
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground text-xs">Contrato</p>
                  <p className="font-medium">#{task.contract.contract_number}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
