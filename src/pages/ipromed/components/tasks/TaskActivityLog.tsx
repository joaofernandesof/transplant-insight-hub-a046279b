import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { History, Plus, Edit, CheckCircle2, Trash2, RotateCcw, FileText } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

const actionConfig: Record<string, { label: string; icon: typeof Plus; color: string; bg: string }> = {
  created: { label: "Criou", icon: Plus, color: "text-emerald-600", bg: "bg-emerald-100 dark:bg-emerald-900/30" },
  updated: { label: "Editou", icon: Edit, color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/30" },
  completed: { label: "Concluiu", icon: CheckCircle2, color: "text-violet-600", bg: "bg-violet-100 dark:bg-violet-900/30" },
  restored: { label: "Restaurou", icon: RotateCcw, color: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-900/30" },
  deleted: { label: "Excluiu", icon: Trash2, color: "text-rose-600", bg: "bg-rose-100 dark:bg-rose-900/30" },
  status_changed: { label: "Alterou status", icon: FileText, color: "text-sky-600", bg: "bg-sky-100 dark:bg-sky-900/30" },
};

interface ActivityLog {
  id: string;
  task_title: string;
  action: string;
  changes: Record<string, any> | null;
  performed_by_name: string | null;
  created_at: string;
}

export function TaskActivityLog() {
  const [open, setOpen] = useState(false);

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["task-activity-log"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_activity_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as ActivityLog[];
    },
    enabled: open,
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <History className="h-4 w-4" />
          Log
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[420px] sm:w-[480px] p-0">
        <SheetHeader className="p-4 pb-2 border-b">
          <SheetTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4" />
            Log de Atividades
          </SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-80px)]">
          <div className="p-3 space-y-1">
            {isLoading ? (
              <p className="text-sm text-muted-foreground text-center py-8">Carregando...</p>
            ) : logs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhuma atividade registrada</p>
            ) : (
              logs.map((log) => {
                const config = actionConfig[log.action] || actionConfig.updated;
                const Icon = config.icon;
                return (
                  <div key={log.id} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className={cn("p-1.5 rounded-md mt-0.5 shrink-0", config.bg)}>
                      <Icon className={cn("h-3.5 w-3.5", config.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-snug">
                        <span className="font-medium">{log.performed_by_name || "Usuário"}</span>
                        {" "}
                        <span className={cn("font-medium", config.color)}>{config.label.toLowerCase()}</span>
                        {" "}
                        <span className="text-muted-foreground">a tarefa</span>
                      </p>
                      <p className="text-xs font-medium text-foreground/80 mt-0.5 truncate">
                        "{log.task_title}"
                      </p>
                      {log.changes && Object.keys(log.changes).length > 0 && (
                        <div className="mt-1 text-[11px] text-muted-foreground space-y-0.5">
                          {Object.entries(log.changes).slice(0, 3).map(([key, val]) => (
                            <p key={key} className="truncate">
                              <span className="font-medium">{formatFieldName(key)}:</span> {String(val)}
                            </p>
                          ))}
                        </div>
                      )}
                      <p className="text-[11px] text-muted-foreground/60 mt-1">
                        {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: ptBR })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

function formatFieldName(key: string): string {
  const map: Record<string, string> = {
    title: "Título",
    description: "Descrição",
    status: "Status",
    priority: "Prioridade",
    due_date: "Prazo",
    assigned_to_name: "Responsável",
    category: "Categoria",
  };
  return map[key] || key;
}
