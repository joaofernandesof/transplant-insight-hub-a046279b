/**
 * CPG Advocacia Médica - Módulo de Tarefas
 * Layout Kanban inspirado no NeoTeam com colunas coloridas
 */

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  BarChart3,
  Calendar,
  AlertTriangle,
  Loader2,
  Flag,
  Filter,
  Eye,
  Edit,
  Trash2,
  CalendarClock,
  MoreVertical,
  GripVertical,
  ArrowUpDown,
  CheckSquare,
} from "lucide-react";
import { format, isPast, isToday, isTomorrow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext";
import { TaskFormDialog } from "./components/tasks/TaskFormDialog";
import { TaskDetailSheet } from "./components/tasks/TaskDetailSheet";

export type TaskStatus = "todo" | "in_progress" | "in_review" | "done";
export type TaskPriority = 1 | 2 | 3;

export interface Subtask {
  id: string;
  task_id: string;
  title: string;
  is_completed: boolean;
  order_index: number;
  completed_at: string | null;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: number;
  due_date: string | null;
  assigned_to: string | null;
  assigned_to_name: string | null;
  client_id: string | null;
  contract_id: string | null;
  case_id: string | null;
  category: string | null;
  tags: string[] | null;
  order_index: number;
  completed_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  subtasks_count?: number;
  subtasks_completed?: number;
}

const statusColumns: { id: TaskStatus; label: string; headerColor: string; headerText: string; borderColor: string; cardBorder: string; countBg: string; countText: string; emptyBg: string }[] = [
  {
    id: "todo",
    label: "A Fazer",
    headerColor: "bg-amber-50 dark:bg-amber-950/30",
    headerText: "text-amber-700 dark:text-amber-400",
    borderColor: "border-b-amber-400",
    cardBorder: "border-l-amber-400",
    countBg: "bg-amber-100 dark:bg-amber-900/50",
    countText: "text-amber-700 dark:text-amber-300",
    emptyBg: "bg-amber-50/50 dark:bg-amber-950/10",
  },
  {
    id: "in_progress",
    label: "Em Andamento",
    headerColor: "bg-orange-50 dark:bg-orange-950/30",
    headerText: "text-orange-700 dark:text-orange-400",
    borderColor: "border-b-orange-400",
    cardBorder: "border-l-orange-400",
    countBg: "bg-orange-100 dark:bg-orange-900/50",
    countText: "text-orange-700 dark:text-orange-300",
    emptyBg: "bg-orange-50/50 dark:bg-orange-950/10",
  },
  {
    id: "in_review",
    label: "Em Revisão",
    headerColor: "bg-sky-50 dark:bg-sky-950/30",
    headerText: "text-sky-700 dark:text-sky-400",
    borderColor: "border-b-sky-400",
    cardBorder: "border-l-sky-400",
    countBg: "bg-sky-100 dark:bg-sky-900/50",
    countText: "text-sky-700 dark:text-sky-300",
    emptyBg: "bg-sky-50/50 dark:bg-sky-950/10",
  },
  {
    id: "done",
    label: "Concluído",
    headerColor: "bg-emerald-50 dark:bg-emerald-950/30",
    headerText: "text-emerald-700 dark:text-emerald-400",
    borderColor: "border-b-emerald-400",
    cardBorder: "border-l-emerald-400",
    countBg: "bg-emerald-100 dark:bg-emerald-900/50",
    countText: "text-emerald-700 dark:text-emerald-300",
    emptyBg: "bg-emerald-50/50 dark:bg-emerald-950/10",
  },
];

const priorityConfig = {
  1: { label: "Baixa", color: "text-slate-500", bgColor: "bg-slate-100 dark:bg-slate-800", solidBg: "bg-slate-500" },
  2: { label: "Média", color: "text-amber-600", bgColor: "bg-amber-100 dark:bg-amber-900/50", solidBg: "bg-amber-500" },
  3: { label: "Alta", color: "text-rose-600", bgColor: "bg-rose-100 dark:bg-rose-900/50", solidBg: "bg-rose-500" },
};

const statusConfig = {
  todo: { label: "A Fazer", bgColor: "bg-slate-500", textColor: "text-white", lightBg: "bg-slate-50", dotColor: "bg-slate-500" },
  in_progress: { label: "Em Andamento", bgColor: "bg-blue-500", textColor: "text-white", lightBg: "bg-blue-50", dotColor: "bg-blue-500" },
  in_review: { label: "Em Revisão", bgColor: "bg-amber-500", textColor: "text-white", lightBg: "bg-amber-50", dotColor: "bg-amber-500" },
  done: { label: "Concluído", bgColor: "bg-emerald-500", textColor: "text-white", lightBg: "bg-emerald-50", dotColor: "bg-emerald-500" },
};

export default function IpromedTasks() {
  const { user } = useUnifiedAuth();
  const queryClient = useQueryClient();

  const [viewMode, setViewMode] = useState<"kanban" | "list" | "dashboard">("kanban");
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("priority");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const { data: tasks = [], isLoading, refetch } = useQuery({
    queryKey: ["ipromed-tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ipromed_legal_tasks")
        .select("*")
        .order("order_index", { ascending: true });
      if (error) throw error;
      return data as Task[];
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Task> & { id: string }) => {
      const { error } = await supabase
        .from("ipromed_legal_tasks")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ipromed-tasks"] });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("ipromed_legal_tasks")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ipromed-tasks"] });
      toast.success("Tarefa excluída");
    },
  });

  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(query) ||
          t.description?.toLowerCase().includes(query) ||
          t.category?.toLowerCase().includes(query)
      );
    }

    if (priorityFilter !== "all") {
      result = result.filter((t) => String(t.priority) === priorityFilter);
    }

    result.sort((a, b) => {
      if (sortBy === "priority") return (b.priority || 0) - (a.priority || 0);
      if (!a.due_date && !b.due_date) return 0;
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    });

    return result;
  }, [tasks, searchQuery, priorityFilter, sortBy]);

  const stats = useMemo(() => ({
    todo: tasks.filter((t) => t.status === "todo").length,
    in_progress: tasks.filter((t) => t.status === "in_progress").length,
    in_review: tasks.filter((t) => t.status === "in_review").length,
    done: tasks.filter((t) => t.status === "done").length,
  }), [tasks]);

  const tasksByStatus = useMemo(() => {
    const grouped: Record<string, Task[]> = { todo: [], in_progress: [], in_review: [], done: [] };
    filteredTasks.forEach((task) => {
      if (grouped[task.status]) grouped[task.status].push(task);
    });
    return grouped;
  }, [filteredTasks]);

  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    updateTaskMutation.mutate({
      id: taskId,
      status: newStatus,
      completed_at: newStatus === "done" ? new Date().toISOString() : null,
    });
  };

  const getDueDateInfo = (dueDate: string | null, status: string) => {
    if (!dueDate) return null;
    const date = new Date(dueDate);
    const isOverdue = isPast(date) && !isToday(date) && status !== "done";
    const isDueToday = isToday(date);
    return {
      text: isDueToday ? "Hoje" : isTomorrow(date) ? "Amanhã" : format(date, "dd MMM", { locale: ptBR }),
      isOverdue,
      isDueToday,
    };
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="pb-4 flex-shrink-0">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs text-muted-foreground mb-1">CPG Advocacia &gt; Tarefas</p>
            <h1 className="text-2xl font-bold">Tarefas</h1>
            <p className="text-muted-foreground text-sm">
              Gerencie as tarefas da equipe
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
              <TabsList>
                <TabsTrigger value="kanban" className="gap-1.5">
                  <LayoutGrid className="h-4 w-4" />
                  Kanban
                </TabsTrigger>
                <TabsTrigger value="list" className="gap-1.5">
                  <List className="h-4 w-4" />
                  Lista
                </TabsTrigger>
                <TabsTrigger value="dashboard" className="gap-1.5">
                  <BarChart3 className="h-4 w-4" />
                  Dashboard
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <Button onClick={() => { setEditingTask(null); setIsFormOpen(true); }} className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Tarefa
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Bar + Filters */}
      <div className="pb-4 flex-shrink-0">
        <div className="flex flex-wrap items-center gap-4 p-3 bg-muted/40 rounded-xl border">
          {/* Inline stats */}
          <div className="flex items-center gap-4 mr-2">
            <span className="flex items-center gap-1.5 text-sm">
              <span className="text-xl font-bold">{stats.todo}</span>
              <span className="text-muted-foreground">A Fazer</span>
            </span>
            <span className="flex items-center gap-1.5 text-sm">
              <span className="text-xl font-bold text-orange-600">{stats.in_progress}</span>
              <span className="text-muted-foreground">Em Andamento</span>
            </span>
            <span className="flex items-center gap-1.5 text-sm">
              <span className="text-xl font-bold text-emerald-600">{stats.done}</span>
              <span className="text-muted-foreground">Concluído</span>
            </span>
            <span className="flex items-center gap-1.5 text-sm">
              <span className="text-xl font-bold text-sky-600">{stats.in_review}</span>
              <span className="text-muted-foreground">Em Revisão</span>
            </span>
          </div>

          <div className="h-6 w-px bg-border hidden md:block" />

          {/* Search */}
          <div className="relative flex-1 min-w-[180px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar tarefas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background h-9"
            />
          </div>

          {/* Priority filter */}
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[120px] bg-background h-9">
              <Filter className="h-3.5 w-3.5 mr-1" />
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="3">Alta</SelectItem>
              <SelectItem value="2">Média</SelectItem>
              <SelectItem value="1">Baixa</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[140px] bg-background h-9">
              <ArrowUpDown className="h-3.5 w-3.5 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="priority">Prioridade</SelectItem>
              <SelectItem value="due_date">Prazo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 pb-6 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : viewMode === "kanban" ? (
          /* ===== KANBAN VIEW ===== */
          <div className="h-full overflow-x-auto">
            <div className="flex gap-4 h-full min-w-max pb-2">
              {statusColumns.map((column) => {
                const columnTasks = tasksByStatus[column.id] || [];

                return (
                  <div key={column.id} className="w-[300px] flex-shrink-0 flex flex-col h-full">
                    {/* Column Header */}
                    <div className={cn("px-4 py-3 rounded-t-lg border-b-2 flex items-center justify-between", column.headerColor, column.borderColor)}>
                      <span className={cn("font-semibold text-sm", column.headerText)}>{column.label}</span>
                      <Badge variant="secondary" className={cn("font-bold text-xs", column.countBg, column.countText)}>
                        {columnTasks.length}
                      </Badge>
                    </div>

                    {/* Column Body */}
                    <ScrollArea className="flex-1 min-h-0">
                      <div className={cn("p-2 space-y-2 min-h-[200px]", column.emptyBg)}>
                        {columnTasks.length === 0 ? (
                          <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
                            Arraste tarefas aqui
                          </div>
                        ) : (
                          columnTasks.map((task) => (
                            <TaskCard
                              key={task.id}
                              task={task}
                              columnConfig={column}
                              getDueDateInfo={getDueDateInfo}
                              onView={() => { setSelectedTask(task); setIsDetailOpen(true); }}
                              onEdit={() => { setEditingTask(task); setIsFormOpen(true); }}
                              onDelete={() => deleteTaskMutation.mutate(task.id)}
                            />
                          ))
                        )}
                      </div>
                    </ScrollArea>

                    {/* Add task button */}
                    <button
                      className="flex items-center justify-center gap-1.5 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors border-t"
                      onClick={() => { setEditingTask(null); setIsFormOpen(true); }}
                    >
                      <Plus className="h-4 w-4" />
                      Adicionar Tarefa
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ) : viewMode === "list" ? (
          /* ===== LIST VIEW ===== */
          <div className="h-full overflow-auto rounded-lg border bg-background">
            {filteredTasks.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                Nenhuma tarefa encontrada
              </div>
            ) : (
              <div className="divide-y">
                {filteredTasks.map((task) => {
                  const dueDateInfo = getDueDateInfo(task.due_date, task.status);
                  const priorityCfg = priorityConfig[task.priority as 1 | 2 | 3];
                  const statusCfg = statusConfig[task.status as TaskStatus];

                  return (
                    <div
                      key={task.id}
                      className="p-4 hover:bg-muted/50 cursor-pointer transition-colors flex items-center gap-4"
                      onClick={() => { setSelectedTask(task); setIsDetailOpen(true); }}
                    >
                      <div className={cn("w-1.5 h-10 rounded-full flex-shrink-0", priorityCfg?.solidBg)} />
                      <div className="flex-1 min-w-0">
                        <p className={cn("font-medium text-sm truncate", task.status === "done" && "line-through text-muted-foreground")}>
                          {task.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={cn("text-[10px] px-1.5", statusCfg?.bgColor, statusCfg?.textColor)}>{statusCfg?.label}</Badge>
                          {dueDateInfo && (
                            <span className={cn("text-xs flex items-center gap-1", dueDateInfo.isOverdue && "text-rose-600 font-medium", dueDateInfo.isDueToday && "text-amber-600")}>
                              <Calendar className="h-3 w-3" />
                              {dueDateInfo.text}
                            </span>
                          )}
                          {task.category && <Badge variant="outline" className="text-[10px]">{task.category}</Badge>}
                        </div>
                      </div>
                      {task.assigned_to_name && (
                        <span className="text-xs text-muted-foreground hidden md:block">{task.assigned_to_name}</span>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setEditingTask(task); setIsFormOpen(true); }}>
                            <Edit className="h-4 w-4 mr-2" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); deleteTaskMutation.mutate(task.id); }} className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* ===== DASHBOARD VIEW ===== */
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Dashboard em breve
          </div>
        )}
      </div>

      {/* Form Dialog */}
      <TaskFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        task={editingTask}
        onSuccess={() => {
          setIsFormOpen(false);
          setEditingTask(null);
          queryClient.invalidateQueries({ queryKey: ["ipromed-tasks"] });
        }}
      />

      {/* Detail Sheet */}
      <TaskDetailSheet
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        task={selectedTask}
        onEdit={(task) => { setEditingTask(task); setIsFormOpen(true); }}
        onDelete={(task) => {
          if (window.confirm(`Excluir tarefa "${task.title}"?`)) {
            deleteTaskMutation.mutate(task.id);
          }
        }}
        onStatusChange={handleStatusChange}
        statusConfig={Object.fromEntries(
          Object.entries(statusConfig).map(([k, v]) => [k, { label: v.label, color: v.lightBg, dotColor: v.dotColor }])
        )}
        priorityConfig={{
          1: { label: "Baixa", color: "text-slate-500", icon: Flag },
          2: { label: "Média", color: "text-amber-500", icon: Flag },
          3: { label: "Alta", color: "text-rose-500", icon: Flag },
        }}
      />
    </div>
  );
}

/* ===== Task Card Component ===== */
function TaskCard({
  task,
  columnConfig,
  getDueDateInfo,
  onView,
  onEdit,
  onDelete,
}: {
  task: Task;
  columnConfig: (typeof statusColumns)[number];
  getDueDateInfo: (dueDate: string | null, status: string) => { text: string; isOverdue: boolean; isDueToday: boolean } | null;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const dueDateInfo = getDueDateInfo(task.due_date, task.status);
  const priorityCfg = priorityConfig[task.priority as 1 | 2 | 3];

  return (
    <div
      className={cn(
        "bg-background rounded-lg border border-l-4 p-3 cursor-pointer hover:shadow-md transition-all group",
        columnConfig.cardBorder,
        dueDateInfo?.isOverdue && "ring-1 ring-rose-300 dark:ring-rose-800"
      )}
      onClick={onView}
    >
      {/* Grip + Title row */}
      <div className="flex items-start gap-2">
        <GripVertical className="h-4 w-4 text-muted-foreground/40 mt-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="flex-1 min-w-0">
          {dueDateInfo?.isOverdue && (
            <div className="flex items-center gap-1 text-[11px] text-rose-600 font-medium mb-1">
              <AlertTriangle className="h-3 w-3" />
              Atrasada
            </div>
          )}
          <p className={cn(
            "font-medium text-sm line-clamp-2",
            task.status === "done" && "line-through text-muted-foreground"
          )}>
            {task.title}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 flex-shrink-0">
              <MoreVertical className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onView(); }}>
              <Eye className="h-4 w-4 mr-2" /> Ver Detalhes
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
              <Edit className="h-4 w-4 mr-2" /> Editar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-destructive">
              <Trash2 className="h-4 w-4 mr-2" /> Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Footer: date + priority */}
      <div className="flex items-center gap-2 mt-2.5">
        {dueDateInfo && (
          <div className={cn(
            "flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded",
            dueDateInfo.isOverdue
              ? "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300"
              : dueDateInfo.isDueToday
                ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"
                : "bg-muted text-muted-foreground"
          )}>
            <CalendarClock className="h-3 w-3" />
            {dueDateInfo.text}
          </div>
        )}
        {priorityCfg && (
          <div className={cn("flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded", priorityCfg.bgColor, priorityCfg.color)}>
            <Flag className="h-3 w-3" />
            {priorityCfg.label}
          </div>
        )}
        {task.assigned_to_name && (
          <span className="ml-auto text-[11px] text-muted-foreground truncate max-w-[80px]">
            {task.assigned_to_name.split(" ")[0]}
          </span>
        )}
      </div>
    </div>
  );
}
