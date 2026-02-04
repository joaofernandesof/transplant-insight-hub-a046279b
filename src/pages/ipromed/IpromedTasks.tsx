/**
 * CPG Advocacia Médica - Módulo de Tarefas
 * Gestão completa de tarefas com Kanban e Lista
 */

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  CheckSquare,
  Plus,
  Search,
  LayoutGrid,
  List,
  Filter,
  ArrowUpDown,
  Calendar,
  Clock,
  User,
  MoreVertical,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Loader2,
  Flag,
  ChevronDown,
  RefreshCw,
} from "lucide-react";
import { format, isPast, isToday, isTomorrow, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext";

// Components
import { TaskKanbanView } from "./components/tasks/TaskKanbanView";
import { TaskListView } from "./components/tasks/TaskListView";
import { TaskFormDialog } from "./components/tasks/TaskFormDialog";
import { TaskDetailSheet } from "./components/tasks/TaskDetailSheet";

export type TaskStatus = "todo" | "in_progress" | "in_review" | "done";
export type TaskPriority = 1 | 2 | 3; // 1=low, 2=medium, 3=high

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
  // Computed
  subtasks_count?: number;
  subtasks_completed?: number;
}

export interface Subtask {
  id: string;
  task_id: string;
  title: string;
  is_completed: boolean;
  order_index: number;
  completed_at: string | null;
  created_at: string;
}

const statusConfig = {
  todo: { label: "A Fazer", color: "bg-slate-100 text-slate-700 border-slate-300", dotColor: "bg-slate-400" },
  in_progress: { label: "Em Andamento", color: "bg-blue-100 text-blue-700 border-blue-300", dotColor: "bg-blue-500" },
  in_review: { label: "Em Revisão", color: "bg-amber-100 text-amber-700 border-amber-300", dotColor: "bg-amber-500" },
  done: { label: "Concluído", color: "bg-emerald-100 text-emerald-700 border-emerald-300", dotColor: "bg-emerald-500" },
};

const priorityConfig = {
  1: { label: "Baixa", color: "text-slate-500", icon: Flag },
  2: { label: "Média", color: "text-amber-500", icon: Flag },
  3: { label: "Alta", color: "text-rose-500", icon: Flag },
};

export default function IpromedTasks() {
  const { user } = useUnifiedAuth();
  const queryClient = useQueryClient();
  
  // View & Filter State
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("due_date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  
  // Dialog State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Fetch tasks
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

  // Fetch subtasks counts
  const { data: subtasksCounts = {} } = useQuery({
    queryKey: ["ipromed-subtasks-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ipromed_legal_subtasks")
        .select("task_id, is_completed");

      if (error) throw error;
      
      const counts: Record<string, { total: number; completed: number }> = {};
      data?.forEach((s) => {
        if (!counts[s.task_id]) {
          counts[s.task_id] = { total: 0, completed: 0 };
        }
        counts[s.task_id].total++;
        if (s.is_completed) counts[s.task_id].completed++;
      });
      return counts;
    },
  });

  // Update task mutation
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
    onError: () => {
      toast.error("Erro ao atualizar tarefa");
    },
  });

  // Delete task mutation
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
    onError: () => {
      toast.error("Erro ao excluir tarefa");
    },
  });

  // Filtered & Sorted tasks
  const filteredTasks = useMemo(() => {
    let result = tasks.map((t) => ({
      ...t,
      subtasks_count: subtasksCounts[t.id]?.total || 0,
      subtasks_completed: subtasksCounts[t.id]?.completed || 0,
    }));

    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(query) ||
          t.description?.toLowerCase().includes(query) ||
          t.category?.toLowerCase().includes(query) ||
          t.tags?.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((t) => t.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== "all") {
      result = result.filter((t) => String(t.priority) === priorityFilter);
    }

    // Assignee filter
    if (assigneeFilter !== "all") {
      if (assigneeFilter === "me") {
        result = result.filter((t) => t.assigned_to === user?.id);
      } else if (assigneeFilter === "unassigned") {
        result = result.filter((t) => !t.assigned_to);
      }
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "due_date":
          if (!a.due_date && !b.due_date) comparison = 0;
          else if (!a.due_date) comparison = 1;
          else if (!b.due_date) comparison = -1;
          else comparison = new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
          break;
        case "priority":
          comparison = (b.priority || 0) - (a.priority || 0);
          break;
        case "created_at":
          comparison = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          break;
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return result;
  }, [tasks, subtasksCounts, searchQuery, statusFilter, priorityFilter, assigneeFilter, sortBy, sortOrder, user?.id]);

  // Stats
  const stats = useMemo(() => ({
    total: tasks.length,
    todo: tasks.filter((t) => t.status === "todo").length,
    inProgress: tasks.filter((t) => t.status === "in_progress").length,
    inReview: tasks.filter((t) => t.status === "in_review").length,
    done: tasks.filter((t) => t.status === "done").length,
    overdue: tasks.filter((t) => t.due_date && isPast(new Date(t.due_date)) && t.status !== "done").length,
    highPriority: tasks.filter((t) => t.priority === 3 && t.status !== "done").length,
  }), [tasks]);

  const handleOpenTask = (task: Task) => {
    setSelectedTask(task);
    setIsDetailOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };

  const handleDeleteTask = (task: Task) => {
    if (window.confirm(`Excluir tarefa "${task.title}"?`)) {
      deleteTaskMutation.mutate(task.id);
    }
  };

  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    updateTaskMutation.mutate({
      id: taskId,
      status: newStatus,
      completed_at: newStatus === "done" ? new Date().toISOString() : null,
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CheckSquare className="h-7 w-7 text-primary" />
            Tarefas
          </h1>
          <p className="text-muted-foreground text-sm">
            Gerencie todas as tarefas do escritório
          </p>
        </div>
        <Button onClick={() => { setEditingTask(null); setIsFormOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Tarefa
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <Card className="p-3 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter("all")}>
          <div className="text-xs text-muted-foreground">Total</div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </Card>
        <Card className={cn("p-3 cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-slate-400", statusFilter === "todo" && "ring-2 ring-primary")} onClick={() => setStatusFilter("todo")}>
          <div className="text-xs text-muted-foreground">A Fazer</div>
          <div className="text-2xl font-bold text-slate-600">{stats.todo}</div>
        </Card>
        <Card className={cn("p-3 cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-blue-500", statusFilter === "in_progress" && "ring-2 ring-primary")} onClick={() => setStatusFilter("in_progress")}>
          <div className="text-xs text-muted-foreground">Em Andamento</div>
          <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
        </Card>
        <Card className={cn("p-3 cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-amber-500", statusFilter === "in_review" && "ring-2 ring-primary")} onClick={() => setStatusFilter("in_review")}>
          <div className="text-xs text-muted-foreground">Em Revisão</div>
          <div className="text-2xl font-bold text-amber-600">{stats.inReview}</div>
        </Card>
        <Card className={cn("p-3 cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-emerald-500", statusFilter === "done" && "ring-2 ring-primary")} onClick={() => setStatusFilter("done")}>
          <div className="text-xs text-muted-foreground">Concluído</div>
          <div className="text-2xl font-bold text-emerald-600">{stats.done}</div>
        </Card>
        <Card className="p-3 border-l-4 border-l-rose-500">
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" /> Atrasadas
          </div>
          <div className="text-2xl font-bold text-rose-600">{stats.overdue}</div>
        </Card>
        <Card className="p-3 border-l-4 border-l-orange-500">
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Flag className="h-3 w-3" /> Alta Prior.
          </div>
          <div className="text-2xl font-bold text-orange-600">{stats.highPriority}</div>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between bg-muted/30 p-3 rounded-lg">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar tarefas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[130px]">
              <Flag className="h-4 w-4 mr-1" />
              <SelectValue placeholder="Prioridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="3">Alta</SelectItem>
              <SelectItem value="2">Média</SelectItem>
              <SelectItem value="1">Baixa</SelectItem>
            </SelectContent>
          </Select>

          <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
            <SelectTrigger className="w-[140px]">
              <User className="h-4 w-4 mr-1" />
              <SelectValue placeholder="Responsável" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="me">Minhas Tarefas</SelectItem>
              <SelectItem value="unassigned">Sem Responsável</SelectItem>
            </SelectContent>
          </Select>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <ArrowUpDown className="h-4 w-4" />
                Ordenar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSortBy("due_date")}>
                <Calendar className="h-4 w-4 mr-2" /> Prazo
                {sortBy === "due_date" && <CheckCircle2 className="h-4 w-4 ml-auto" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("priority")}>
                <Flag className="h-4 w-4 mr-2" /> Prioridade
                {sortBy === "priority" && <CheckCircle2 className="h-4 w-4 ml-auto" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("created_at")}>
                <Clock className="h-4 w-4 mr-2" /> Data de Criação
                {sortBy === "created_at" && <CheckCircle2 className="h-4 w-4 ml-auto" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("title")}>
                <CheckSquare className="h-4 w-4 mr-2" /> Título
                {sortBy === "title" && <CheckCircle2 className="h-4 w-4 ml-auto" />}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}>
                {sortOrder === "asc" ? "↑ Crescente" : "↓ Decrescente"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {(statusFilter !== "all" || priorityFilter !== "all" || assigneeFilter !== "all" || searchQuery) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStatusFilter("all");
                setPriorityFilter("all");
                setAssigneeFilter("all");
                setSearchQuery("");
              }}
              className="text-muted-foreground"
            >
              Limpar Filtros
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "kanban" | "list")}>
            <TabsList className="h-9">
              <TabsTrigger value="kanban" className="gap-1 px-3">
                <LayoutGrid className="h-4 w-4" />
                <span className="hidden sm:inline">Kanban</span>
              </TabsTrigger>
              <TabsTrigger value="list" className="gap-1 px-3">
                <List className="h-4 w-4" />
                <span className="hidden sm:inline">Lista</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : viewMode === "kanban" ? (
        <TaskKanbanView
          tasks={filteredTasks}
          onOpenTask={handleOpenTask}
          onEditTask={handleEditTask}
          onDeleteTask={handleDeleteTask}
          onStatusChange={handleStatusChange}
          statusConfig={statusConfig}
          priorityConfig={priorityConfig}
        />
      ) : (
        <TaskListView
          tasks={filteredTasks}
          onOpenTask={handleOpenTask}
          onEditTask={handleEditTask}
          onDeleteTask={handleDeleteTask}
          onStatusChange={handleStatusChange}
          statusConfig={statusConfig}
          priorityConfig={priorityConfig}
        />
      )}

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
        onEdit={handleEditTask}
        onDelete={handleDeleteTask}
        onStatusChange={handleStatusChange}
        statusConfig={statusConfig}
        priorityConfig={priorityConfig}
      />
    </div>
  );
}
