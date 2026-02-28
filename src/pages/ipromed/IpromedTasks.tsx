/**
 * CPG Advocacia Médica - Módulo de Tarefas
 * Layout Kanban inspirado no NeoTeam com colunas coloridas
 */

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { invalidateAllTaskQueries } from "./utils/invalidateTaskQueries";
import { logTaskActivity } from "./utils/logTaskActivity";
import { TaskActivityLog } from "./components/tasks/TaskActivityLog";
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
import { TaskDashboard } from "./components/tasks/TaskDashboard";

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

const statusColumns: { id: TaskStatus; label: string; headerBg: string; headerText: string; cardBorder: string; countBg: string; countText: string; columnBg: string; dotColor: string }[] = [
  {
    id: "todo",
    label: "A Fazer",
    headerBg: "bg-amber-500",
    headerText: "text-white",
    cardBorder: "border-l-amber-500",
    countBg: "bg-white/25",
    countText: "text-white",
    columnBg: "bg-amber-50/60 dark:bg-amber-950/20",
    dotColor: "bg-amber-500",
  },
  {
    id: "in_progress",
    label: "Em Andamento",
    headerBg: "bg-blue-500",
    headerText: "text-white",
    cardBorder: "border-l-blue-500",
    countBg: "bg-white/25",
    countText: "text-white",
    columnBg: "bg-blue-50/60 dark:bg-blue-950/20",
    dotColor: "bg-blue-500",
  },
  {
    id: "in_review",
    label: "Em Revisão",
    headerBg: "bg-violet-500",
    headerText: "text-white",
    cardBorder: "border-l-violet-500",
    countBg: "bg-white/25",
    countText: "text-white",
    columnBg: "bg-violet-50/60 dark:bg-violet-950/20",
    dotColor: "bg-violet-500",
  },
  {
    id: "done",
    label: "Concluído",
    headerBg: "bg-emerald-500",
    headerText: "text-white",
    cardBorder: "border-l-emerald-500",
    countBg: "bg-white/25",
    countText: "text-white",
    columnBg: "bg-emerald-50/60 dark:bg-emerald-950/20",
    dotColor: "bg-emerald-500",
  },
];

const priorityConfig = {
  1: { label: "Baixa", color: "text-slate-600", bgColor: "bg-slate-100 dark:bg-slate-800", solidBg: "bg-slate-400" },
  2: { label: "Média", color: "text-amber-700", bgColor: "bg-amber-100 dark:bg-amber-900/50", solidBg: "bg-amber-500" },
  3: { label: "Alta", color: "text-rose-700", bgColor: "bg-rose-100 dark:bg-rose-900/50", solidBg: "bg-rose-500" },
};

const statusConfig = {
  todo: { label: "A Fazer", bgColor: "bg-amber-500", textColor: "text-white", lightBg: "bg-amber-50", dotColor: "bg-amber-500" },
  in_progress: { label: "Em Andamento", bgColor: "bg-blue-500", textColor: "text-white", lightBg: "bg-blue-50", dotColor: "bg-blue-500" },
  in_review: { label: "Em Revisão", bgColor: "bg-violet-500", textColor: "text-white", lightBg: "bg-violet-50", dotColor: "bg-violet-500" },
  done: { label: "Concluído", bgColor: "bg-emerald-500", textColor: "text-white", lightBg: "bg-emerald-50", dotColor: "bg-emerald-500" },
};

export default function IpromedTasks() {
  const { user } = useUnifiedAuth();
  const queryClient = useQueryClient();

  const [viewMode, setViewMode] = useState<"kanban" | "list" | "dashboard">("kanban");
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [userFilter, setUserFilter] = useState<string>("all");
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
      invalidateAllTaskQueries(queryClient);
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
      invalidateAllTaskQueries(queryClient);
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

    if (userFilter !== "all") {
      result = result.filter((t) => t.assigned_to_name === userFilter);
    }

    result.sort((a, b) => {
      if (sortBy === "priority") return (b.priority || 0) - (a.priority || 0);
      if (!a.due_date && !b.due_date) return 0;
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    });

    return result;
  }, [tasks, searchQuery, priorityFilter, userFilter, sortBy]);

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

  const tasksByDueDate = useMemo(() => {
    const grouped: Record<string, Task[]> = { overdue: [], today: [], tomorrow: [], upcoming: [], no_date: [], completed: [] };
    const now = new Date();
    filteredTasks.forEach((task) => {
      if (task.status === "done") {
        grouped.completed.push(task);
        return;
      }
      if (!task.due_date) {
        grouped.no_date.push(task);
      } else {
        const date = new Date(task.due_date);
        if (isPast(date) && !isToday(date)) {
          grouped.overdue.push(task);
        } else if (isToday(date)) {
          grouped.today.push(task);
        } else if (isTomorrow(date)) {
          grouped.tomorrow.push(task);
        } else {
          grouped.upcoming.push(task);
        }
      }
    });
    // Sort completed by completed_at desc
    grouped.completed.sort((a, b) => (b.completed_at || '').localeCompare(a.completed_at || ''));
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
            <Button onClick={() => { setEditingTask(null); setIsFormOpen(true); }} className="gap-2 rounded-xl shadow-md">
              <Plus className="h-4 w-4" />
              Nova Tarefa
            </Button>
          </div>
        </div>
      </div>

      {/* Filters + View Tabs */}
      <div className="pb-4 flex-shrink-0">
        <div className="flex flex-wrap items-center gap-3 p-3 bg-background rounded-2xl border shadow-sm">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar tarefas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 rounded-xl"
            />
          </div>

          {/* Priority filter */}
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[120px] h-9 rounded-xl">
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
            <SelectTrigger className="w-[140px] h-9 rounded-xl">
              <ArrowUpDown className="h-3.5 w-3.5 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="priority">Prioridade</SelectItem>
              <SelectItem value="due_date">Prazo</SelectItem>
            </SelectContent>
          </Select>

          <div className="h-6 w-px bg-border hidden md:block" />

          {/* View mode tabs centered */}
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

          <TaskActivityLog />
        </div>

        {/* User filter buttons */}
        <div className="flex items-center justify-center gap-2 mt-3">
          {[
            { value: "all", label: "Todos" },
            { value: "Dra. Caroline Parahyba", label: "Dra. Caroline" },
            { value: "Dra. Larissa Guerreiro", label: "Dra. Larissa" },
            { value: "Isabele Cartaxo", label: "Isabele" },
          ].map((opt) => (
            <Button
              key={opt.value}
              variant={userFilter === opt.value ? "default" : "outline"}
              size="sm"
              onClick={() => setUserFilter(opt.value)}
              className="rounded-full px-4 text-xs"
            >
              {opt.label}
              {opt.value !== "all" && (
                <Badge variant="secondary" className="ml-1.5 h-5 min-w-5 px-1 text-[10px] rounded-full">
                  {tasks.filter(t => t.assigned_to_name === opt.value && t.status !== "done").length}
                </Badge>
              )}
            </Button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 pb-6 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : viewMode === "kanban" ? (
          /* ===== KANBAN BY DUE DATE ===== */
          <div className="h-full">
            <div className="grid grid-cols-6 gap-3 h-full">
              {([
                { id: "overdue" as const, label: "Em atraso", headerBg: "bg-rose-500", columnBg: "bg-rose-50/60 dark:bg-rose-950/20", cardBorder: "border-l-rose-500" },
                { id: "today" as const, label: "Hoje", headerBg: "bg-amber-500", columnBg: "bg-amber-50/60 dark:bg-amber-950/20", cardBorder: "border-l-amber-500" },
                { id: "tomorrow" as const, label: "Amanhã", headerBg: "bg-blue-500", columnBg: "bg-blue-50/60 dark:bg-blue-950/20", cardBorder: "border-l-blue-500" },
                { id: "upcoming" as const, label: "Próximos dias", headerBg: "bg-emerald-500", columnBg: "bg-emerald-50/60 dark:bg-emerald-950/20", cardBorder: "border-l-emerald-500" },
                { id: "no_date" as const, label: "Sem prazo", headerBg: "bg-slate-400", columnBg: "bg-slate-50/60 dark:bg-slate-950/20", cardBorder: "border-l-slate-400" },
                { id: "completed" as const, label: "Concluídas", headerBg: "bg-emerald-600", columnBg: "bg-emerald-50/40 dark:bg-emerald-950/10", cardBorder: "border-l-emerald-600" },
              ]).map((column) => {
                const columnTasks = tasksByDueDate[column.id] || [];

                return (
                  <div key={column.id} className="flex flex-col h-full min-w-0 rounded-2xl overflow-hidden border shadow-sm">
                    <div className={cn("px-3 py-2.5 flex items-center justify-between", column.headerBg)}>
                      <span className="font-semibold text-sm text-white">{column.label}</span>
                      <Badge className="font-bold text-xs rounded-full h-6 min-w-6 flex items-center justify-center bg-white/25 text-white">
                        {columnTasks.length}
                      </Badge>
                    </div>

                    <ScrollArea className="flex-1 min-h-0">
                      <div className={cn("p-2.5 space-y-2.5 min-h-[200px]", column.columnBg)}>
                        {columnTasks.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-[200px] text-sm text-muted-foreground gap-1">
                            <CheckSquare className="h-8 w-8 text-muted-foreground/30" />
                            <span>Nenhuma tarefa</span>
                          </div>
                        ) : (
                          columnTasks.map((task) => {
                            const pCfg = priorityConfig[task.priority as 1 | 2 | 3];
                            const sCfg = statusConfig[task.status as TaskStatus];
                            return (
                              <div
                                key={task.id}
                                className={cn(
                                  "bg-background rounded-xl border border-l-4 p-3 cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group",
                                  column.cardBorder
                                )}
                                onClick={() => { setSelectedTask(task); setIsDetailOpen(true); }}
                              >
                                <div className="flex items-start gap-2">
                                  <p className={cn("font-semibold text-xs line-clamp-2 flex-1 min-w-0", column.id === "completed" && "line-through text-muted-foreground")}>{task.title}</p>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                      <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 flex-shrink-0 rounded-lg">
                                        <MoreVertical className="h-3.5 w-3.5" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedTask(task); setIsDetailOpen(true); }}>
                                        <Eye className="h-4 w-4 mr-2" /> Ver
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setEditingTask(task); setIsFormOpen(true); }}>
                                        <Edit className="h-4 w-4 mr-2" /> Editar
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); deleteTaskMutation.mutate(task.id); }} className="text-destructive">
                                        <Trash2 className="h-4 w-4 mr-2" /> Excluir
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                                <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-dashed flex-wrap">
                                  {sCfg && <Badge className={cn("text-[10px] px-1.5 py-0", sCfg.bgColor, sCfg.textColor)}>{sCfg.label}</Badge>}
                                  {pCfg && (
                                    <div className={cn("flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-md", pCfg.bgColor, pCfg.color)}>
                                      <Flag className="h-2.5 w-2.5" />{pCfg.label}
                                    </div>
                                  )}
                                  {column.id === "completed" && task.completed_at ? (
                                    <span className="text-[10px] text-emerald-600 flex items-center gap-0.5 ml-auto">
                                      <CheckSquare className="h-2.5 w-2.5" />
                                      {format(new Date(task.completed_at), "dd MMM", { locale: ptBR })}
                                    </span>
                                  ) : task.due_date ? (
                                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 ml-auto">
                                      <CalendarClock className="h-2.5 w-2.5" />
                                      {format(new Date(task.due_date), "dd MMM", { locale: ptBR })}
                                    </span>
                                  ) : null}
                                </div>
                                {task.assigned_to_name && (
                                  <span className="text-[10px] text-muted-foreground mt-1 block truncate">{task.assigned_to_name}</span>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </ScrollArea>

                    {column.id !== "completed" && (
                      <button
                        className="flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors border-t bg-background"
                        onClick={() => { setEditingTask(null); setIsFormOpen(true); }}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Adicionar Tarefa
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : viewMode === "list" ? (
          /* ===== LIST VIEW - TABLE ===== */
          <div className="h-full overflow-auto rounded-lg border bg-background">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm border-b">
                <tr>
                  <th className="text-left font-medium px-4 py-3 w-[40%]">Tarefa</th>
                  <th className="text-left font-medium px-3 py-3 w-[13%]">Status</th>
                  <th className="text-left font-medium px-3 py-3 w-[10%]">Prioridade</th>
                  <th className="text-left font-medium px-3 py-3 w-[12%]">Prazo</th>
                  <th className="text-left font-medium px-3 py-3 w-[10%]">Categoria</th>
                  <th className="text-left font-medium px-3 py-3 w-[15%]">Responsável</th>
                  <th className="text-center font-medium px-3 py-3 w-[50px]"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-20 text-muted-foreground">
                      Nenhuma tarefa encontrada
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((task) => {
                    const dueDateInfo = getDueDateInfo(task.due_date, task.status);
                    const priorityCfg = priorityConfig[task.priority as 1 | 2 | 3];
                    const statusCfg = statusConfig[task.status as TaskStatus];

                    return (
                      <tr
                        key={task.id}
                        className="hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => { setSelectedTask(task); setIsDetailOpen(true); }}
                      >
                        {/* Tarefa */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {task.priority === 3 && task.status !== "done" && (
                              <div className="w-1 h-5 rounded-full bg-rose-500 flex-shrink-0" />
                            )}
                            <span className={cn("font-medium truncate", task.status === "done" && "line-through text-muted-foreground")}>
                              {task.title}
                            </span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap", statusCfg?.bgColor, statusCfg?.textColor)}>
                                {statusCfg?.label}
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              {Object.entries(statusConfig).map(([key, cfg]) => (
                                <DropdownMenuItem
                                  key={key}
                                  onClick={() => handleStatusChange(task.id, key as TaskStatus)}
                                  className={cn(task.status === key && "bg-muted")}
                                >
                                  <div className={cn("w-2 h-2 rounded-full mr-2", cfg.dotColor)} />
                                  {cfg.label}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>

                        {/* Prioridade */}
                        <td className="px-3 py-3">
                          <span className={cn("text-xs font-medium", priorityCfg?.color)}>
                            {priorityCfg?.label}
                          </span>
                        </td>

                        {/* Prazo */}
                        <td className="px-3 py-3">
                          {dueDateInfo ? (
                            <span className={cn(
                              "flex items-center gap-1 text-xs whitespace-nowrap",
                              dueDateInfo.isOverdue && "text-rose-600 font-semibold",
                              dueDateInfo.isDueToday && "text-amber-600 font-medium",
                              !dueDateInfo.isOverdue && !dueDateInfo.isDueToday && "text-muted-foreground"
                            )}>
                              {dueDateInfo.isOverdue ? <AlertTriangle className="h-3.5 w-3.5" /> : <Calendar className="h-3.5 w-3.5" />}
                              {dueDateInfo.text}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </td>

                        {/* Categoria */}
                        <td className="px-3 py-3">
                          {task.category ? (
                            <Badge variant="outline" className="text-[10px] font-normal">{task.category}</Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </td>

                        {/* Responsável */}
                        <td className="px-3 py-3">
                          {task.assigned_to_name ? (
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-semibold text-primary flex-shrink-0">
                                {task.assigned_to_name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()}
                              </div>
                              <span className="text-xs truncate max-w-[100px]">{task.assigned_to_name}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </td>

                        {/* Ações */}
                        <td className="px-2 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => { setSelectedTask(task); setIsDetailOpen(true); }}>
                                <Eye className="h-4 w-4 mr-2" /> Ver Detalhes
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { setEditingTask(task); setIsFormOpen(true); }}>
                                <Edit className="h-4 w-4 mr-2" /> Editar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => deleteTaskMutation.mutate(task.id)} className="text-destructive">
                                <Trash2 className="h-4 w-4 mr-2" /> Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* ===== DASHBOARD VIEW ===== */
          <TaskDashboard tasks={tasks} />
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
          invalidateAllTaskQueries(queryClient);
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
        "bg-background rounded-xl border border-l-4 p-3.5 cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group",
        columnConfig.cardBorder,
        dueDateInfo?.isOverdue && "ring-2 ring-rose-400/50 dark:ring-rose-700/50"
      )}
      onClick={onView}
    >
      {/* Title row */}
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          {dueDateInfo?.isOverdue && (
            <div className="flex items-center gap-1 text-[11px] text-rose-600 font-semibold mb-1.5">
              <AlertTriangle className="h-3.5 w-3.5" />
              Atrasada
            </div>
          )}
          <p className={cn(
            "font-semibold text-sm line-clamp-2",
            task.status === "done" && "line-through text-muted-foreground"
          )}>
            {task.title}
          </p>
          {task.description && (
            <p className="text-xs text-muted-foreground line-clamp-1 mt-1">{task.description}</p>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 flex-shrink-0 rounded-lg">
              <MoreVertical className="h-4 w-4" />
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

      {/* Footer: date + priority + assignee */}
      <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-dashed">
        {dueDateInfo && (
          <div className={cn(
            "flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg",
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
          <div className={cn("flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg", priorityCfg.bgColor, priorityCfg.color)}>
            <Flag className="h-3 w-3" />
            {priorityCfg.label}
          </div>
        )}
        {task.assigned_to_name && (
          <span className="ml-auto text-[11px] font-medium text-muted-foreground truncate max-w-[90px]">
            {task.assigned_to_name.split(" ")[0]}
          </span>
        )}
      </div>
    </div>
  );
}
