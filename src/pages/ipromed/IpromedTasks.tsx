/**
 * CPG Advocacia Médica - Módulo de Tarefas
 * Design moderno com cores sólidas vibrantes
 */

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
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
  ArrowUpDown,
  Calendar,
  Clock,
  User,
  MoreVertical,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Flag,
  RefreshCw,
  Filter,
  Eye,
  Edit,
  Trash2,
  CalendarClock,
  Users,
  Flame,
  ListTodo,
} from "lucide-react";
import { format, isPast, isToday, isTomorrow, addDays, subDays } from "date-fns";
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

// Status config with vibrant solid colors
const statusConfig = {
  todo: { 
    label: "A Fazer", 
    bgColor: "bg-slate-500",
    textColor: "text-white",
    lightBg: "bg-slate-50",
    borderColor: "border-slate-500",
    dotColor: "bg-slate-500"
  },
  in_progress: { 
    label: "Em Andamento", 
    bgColor: "bg-blue-500",
    textColor: "text-white",
    lightBg: "bg-blue-50",
    borderColor: "border-blue-500",
    dotColor: "bg-blue-500"
  },
  in_review: { 
    label: "Em Revisão", 
    bgColor: "bg-amber-500",
    textColor: "text-white",
    lightBg: "bg-amber-50",
    borderColor: "border-amber-500",
    dotColor: "bg-amber-500"
  },
  done: { 
    label: "Concluído", 
    bgColor: "bg-emerald-500",
    textColor: "text-white",
    lightBg: "bg-emerald-50",
    borderColor: "border-emerald-500",
    dotColor: "bg-emerald-500"
  },
};

const priorityConfig = {
  1: { label: "Baixa", color: "text-slate-500", bgColor: "bg-slate-100", solidBg: "bg-slate-500" },
  2: { label: "Média", color: "text-amber-600", bgColor: "bg-amber-100", solidBg: "bg-amber-500" },
  3: { label: "Alta", color: "text-rose-600", bgColor: "bg-rose-100", solidBg: "bg-rose-500" },
};

// Mock tasks for demonstration
const mockTasks: Task[] = [
  {
    id: "mock-1",
    title: "Revisar contrato Dr. Carlos Silva",
    description: "Revisão final do contrato de prestação de serviços",
    status: "todo",
    priority: 3,
    due_date: subDays(new Date(), 2).toISOString(), // Atrasada
    assigned_to: null,
    assigned_to_name: "Mariana Rocha",
    client_id: null,
    contract_id: null,
    case_id: null,
    category: "Contratos",
    tags: ["urgente", "contrato"],
    order_index: 1,
    completed_at: null,
    created_by: null,
    created_at: subDays(new Date(), 5).toISOString(),
    updated_at: new Date().toISOString(),
    subtasks_count: 3,
    subtasks_completed: 1,
  },
  {
    id: "mock-2",
    title: "Preparar alegações finais - Processo 1234",
    description: "Elaborar alegações finais para audiência",
    status: "in_progress",
    priority: 3,
    due_date: addDays(new Date(), 1).toISOString(), // Amanhã
    assigned_to: null,
    assigned_to_name: "Isabella Santos",
    client_id: null,
    contract_id: null,
    case_id: null,
    category: "Processos",
    tags: ["audiência", "prazo"],
    order_index: 2,
    completed_at: null,
    created_by: null,
    created_at: subDays(new Date(), 3).toISOString(),
    updated_at: new Date().toISOString(),
    subtasks_count: 5,
    subtasks_completed: 3,
  },
  {
    id: "mock-3",
    title: "Análise de prontuário médico",
    description: "Analisar documentação médica do cliente",
    status: "todo",
    priority: 2,
    due_date: addDays(new Date(), 3).toISOString(),
    assigned_to: null,
    assigned_to_name: "Mariana Rocha",
    client_id: null,
    contract_id: null,
    case_id: null,
    category: "Análise",
    tags: ["prontuário"],
    order_index: 3,
    completed_at: null,
    created_by: null,
    created_at: subDays(new Date(), 2).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "mock-4",
    title: "Enviar notificação extrajudicial",
    description: "Notificação para clínica sobre erro médico",
    status: "in_review",
    priority: 2,
    due_date: new Date().toISOString(), // Hoje
    assigned_to: null,
    assigned_to_name: "Isabella Santos",
    client_id: null,
    contract_id: null,
    case_id: null,
    category: "Notificações",
    tags: ["notificação", "extrajudicial"],
    order_index: 4,
    completed_at: null,
    created_by: null,
    created_at: subDays(new Date(), 4).toISOString(),
    updated_at: new Date().toISOString(),
    subtasks_count: 2,
    subtasks_completed: 2,
  },
  {
    id: "mock-5",
    title: "Reunião inicial com cliente novo",
    description: "Onboarding de novo cliente - Dr. Fábio",
    status: "done",
    priority: 1,
    due_date: subDays(new Date(), 1).toISOString(),
    assigned_to: null,
    assigned_to_name: "Mariana Rocha",
    client_id: null,
    contract_id: null,
    case_id: null,
    category: "Reuniões",
    tags: ["onboarding", "cliente"],
    order_index: 5,
    completed_at: subDays(new Date(), 1).toISOString(),
    created_by: null,
    created_at: subDays(new Date(), 7).toISOString(),
    updated_at: subDays(new Date(), 1).toISOString(),
  },
  {
    id: "mock-6",
    title: "Protocolar petição inicial",
    description: "Protocolar no TJ/CE processo de erro médico",
    status: "todo",
    priority: 3,
    due_date: subDays(new Date(), 1).toISOString(), // Atrasada
    assigned_to: null,
    assigned_to_name: "Isabella Santos",
    client_id: null,
    contract_id: null,
    case_id: null,
    category: "Protocolo",
    tags: ["petição", "TJ"],
    order_index: 6,
    completed_at: null,
    created_by: null,
    created_at: subDays(new Date(), 3).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "mock-7",
    title: "Elaborar parecer jurídico",
    description: "Parecer sobre responsabilidade civil médica",
    status: "in_progress",
    priority: 2,
    due_date: addDays(new Date(), 5).toISOString(),
    assigned_to: null,
    assigned_to_name: "Mariana Rocha",
    client_id: null,
    contract_id: null,
    case_id: null,
    category: "Pareceres",
    tags: ["parecer", "responsabilidade"],
    order_index: 7,
    completed_at: null,
    created_by: null,
    created_at: subDays(new Date(), 1).toISOString(),
    updated_at: new Date().toISOString(),
    subtasks_count: 4,
    subtasks_completed: 1,
  },
  {
    id: "mock-8",
    title: "Acompanhar publicações DJE",
    description: "Verificar publicações dos processos ativos",
    status: "done",
    priority: 1,
    due_date: subDays(new Date(), 2).toISOString(),
    assigned_to: null,
    assigned_to_name: "Isabella Santos",
    client_id: null,
    contract_id: null,
    case_id: null,
    category: "Acompanhamento",
    tags: ["DJE", "publicações"],
    order_index: 8,
    completed_at: subDays(new Date(), 2).toISOString(),
    created_by: null,
    created_at: subDays(new Date(), 5).toISOString(),
    updated_at: subDays(new Date(), 2).toISOString(),
  },
  {
    id: "mock-9",
    title: "Preparar recurso de apelação",
    description: "Recurso contra sentença desfavorável",
    status: "in_review",
    priority: 3,
    due_date: addDays(new Date(), 2).toISOString(),
    assigned_to: null,
    assigned_to_name: "Mariana Rocha",
    client_id: null,
    contract_id: null,
    case_id: null,
    category: "Recursos",
    tags: ["apelação", "recurso"],
    order_index: 9,
    completed_at: null,
    created_by: null,
    created_at: subDays(new Date(), 2).toISOString(),
    updated_at: new Date().toISOString(),
    subtasks_count: 6,
    subtasks_completed: 4,
  },
  {
    id: "mock-10",
    title: "Atualizar cadastro de clientes",
    description: "Verificar dados cadastrais de todos os clientes",
    status: "todo",
    priority: 1,
    due_date: addDays(new Date(), 7).toISOString(),
    assigned_to: null,
    assigned_to_name: "Isabella Santos",
    client_id: null,
    contract_id: null,
    case_id: null,
    category: "Administrativo",
    tags: ["cadastro", "atualização"],
    order_index: 10,
    completed_at: null,
    created_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Unique assignees from mock
const assignees = ["Mariana Rocha", "Isabella Santos"];

export default function IpromedTasks() {
  const { user } = useUnifiedAuth();
  const queryClient = useQueryClient();
  
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("due_date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
  // Use mock data + real data
  const [useMockData] = useState(true);

  const { data: realTasks = [], isLoading, refetch } = useQuery({
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

  const tasks = useMemo(() => {
    if (useMockData && realTasks.length === 0) {
      return mockTasks;
    }
    return realTasks;
  }, [realTasks, useMockData]);

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Task> & { id: string }) => {
      if (id.startsWith("mock-")) {
        toast.success("Tarefa atualizada (demo)");
        return;
      }
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
      if (id.startsWith("mock-")) {
        toast.success("Tarefa excluída (demo)");
        return;
      }
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

  // Filtered & Sorted tasks
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

    if (statusFilter !== "all") {
      result = result.filter((t) => t.status === statusFilter);
    }

    if (priorityFilter !== "all") {
      result = result.filter((t) => String(t.priority) === priorityFilter);
    }

    if (assigneeFilter !== "all") {
      result = result.filter((t) => t.assigned_to_name === assigneeFilter);
    }

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
        default:
          comparison = a.title.localeCompare(b.title);
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return result;
  }, [tasks, searchQuery, statusFilter, priorityFilter, assigneeFilter, sortBy, sortOrder]);

  // Stats
  const stats = useMemo(() => ({
    total: tasks.length,
    todo: tasks.filter((t) => t.status === "todo").length,
    inProgress: tasks.filter((t) => t.status === "in_progress").length,
    inReview: tasks.filter((t) => t.status === "in_review").length,
    done: tasks.filter((t) => t.status === "done").length,
    overdue: tasks.filter((t) => t.due_date && isPast(new Date(t.due_date)) && !isToday(new Date(t.due_date)) && t.status !== "done").length,
    highPriority: tasks.filter((t) => t.priority === 3 && t.status !== "done").length,
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
    const isDueTomorrow = isTomorrow(date);

    return {
      text: isDueToday ? "Hoje" : isDueTomorrow ? "Amanhã" : format(date, "dd MMM", { locale: ptBR }),
      isOverdue,
      isDueToday,
    };
  };

  const getInitials = (name: string) => {
    return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  };

  const columns: { id: TaskStatus; label: string }[] = [
    { id: "todo", label: "A Fazer" },
    { id: "in_progress", label: "Em Andamento" },
    { id: "in_review", label: "Em Revisão" },
    { id: "done", label: "Concluído" },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="pb-4 flex-shrink-0">
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
      </div>

      {/* Stats Cards - Colorful solid backgrounds */}
      <div className="px-6 pb-4 flex-shrink-0">
        <div className="flex gap-3 overflow-x-auto pb-2">
          <Card 
            className={cn(
              "flex-shrink-0 min-w-[130px] cursor-pointer hover:shadow-lg transition-all border-2",
              statusFilter === "all" ? "border-primary ring-2 ring-primary/20" : "border-transparent"
            )} 
            onClick={() => setStatusFilter("all")}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <ListTodo className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className={cn(
              "flex-shrink-0 min-w-[130px] cursor-pointer hover:shadow-lg transition-all border-2 border-l-4 border-l-slate-500",
              statusFilter === "todo" ? "border-slate-500 ring-2 ring-slate-500/20" : "border-transparent border-l-slate-500"
            )} 
            onClick={() => setStatusFilter(statusFilter === "todo" ? "all" : "todo")}
          >
            <CardContent className="p-4">
              <div>
                <p className="text-2xl font-bold text-slate-600">{stats.todo}</p>
                <p className="text-xs text-muted-foreground">A Fazer</p>
              </div>
            </CardContent>
          </Card>

          <Card 
            className={cn(
              "flex-shrink-0 min-w-[130px] cursor-pointer hover:shadow-lg transition-all border-2 border-l-4 border-l-blue-500",
              statusFilter === "in_progress" ? "border-blue-500 ring-2 ring-blue-500/20" : "border-transparent border-l-blue-500"
            )} 
            onClick={() => setStatusFilter(statusFilter === "in_progress" ? "all" : "in_progress")}
          >
            <CardContent className="p-4">
              <div>
                <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
                <p className="text-xs text-muted-foreground">Em Andamento</p>
              </div>
            </CardContent>
          </Card>

          <Card 
            className={cn(
              "flex-shrink-0 min-w-[130px] cursor-pointer hover:shadow-lg transition-all border-2 border-l-4 border-l-amber-500",
              statusFilter === "in_review" ? "border-amber-500 ring-2 ring-amber-500/20" : "border-transparent border-l-amber-500"
            )} 
            onClick={() => setStatusFilter(statusFilter === "in_review" ? "all" : "in_review")}
          >
            <CardContent className="p-4">
              <div>
                <p className="text-2xl font-bold text-amber-600">{stats.inReview}</p>
                <p className="text-xs text-muted-foreground">Em Revisão</p>
              </div>
            </CardContent>
          </Card>

          <Card 
            className={cn(
              "flex-shrink-0 min-w-[130px] cursor-pointer hover:shadow-lg transition-all border-2 border-l-4 border-l-emerald-500",
              statusFilter === "done" ? "border-emerald-500 ring-2 ring-emerald-500/20" : "border-transparent border-l-emerald-500"
            )} 
            onClick={() => setStatusFilter(statusFilter === "done" ? "all" : "done")}
          >
            <CardContent className="p-4">
              <div>
                <p className="text-2xl font-bold text-emerald-600">{stats.done}</p>
                <p className="text-xs text-muted-foreground">Concluído</p>
              </div>
            </CardContent>
          </Card>

          <Card className="flex-shrink-0 min-w-[130px] bg-rose-50 dark:bg-rose-950/30 border-2 border-rose-200 dark:border-rose-900">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-rose-500">
                  <AlertTriangle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-rose-600">{stats.overdue}</p>
                  <p className="text-xs text-rose-600 font-medium">Atrasadas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="flex-shrink-0 min-w-[130px] bg-orange-50 dark:bg-orange-950/30 border-2 border-orange-200 dark:border-orange-900">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500">
                  <Flame className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-600">{stats.highPriority}</p>
                  <p className="text-xs text-orange-600 font-medium">Alta Prior.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Toolbar */}
      <div className="px-6 pb-4 flex-shrink-0">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between bg-muted/40 p-3 rounded-xl border">
          <div className="flex items-center gap-2 flex-1 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar tarefas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-background"
              />
            </div>
            
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[130px] bg-background">
                <Flag className="h-4 w-4 mr-1" />
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="3">
                  <span className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-rose-500" />
                    Alta
                  </span>
                </SelectItem>
                <SelectItem value="2">
                  <span className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    Média
                  </span>
                </SelectItem>
                <SelectItem value="1">
                  <span className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-slate-400" />
                    Baixa
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>

            <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
              <SelectTrigger className="w-[160px] bg-background">
                <Users className="h-4 w-4 mr-1" />
                <SelectValue placeholder="Responsável" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {assignees.map((name) => (
                  <SelectItem key={name} value={name}>
                    <span className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                          {getInitials(name)}
                        </AvatarFallback>
                      </Avatar>
                      {name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1 bg-background">
                  <ArrowUpDown className="h-4 w-4" />
                  Ordenar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSortBy("due_date")}>
                  <Calendar className="h-4 w-4 mr-2" /> Prazo
                  {sortBy === "due_date" && <CheckCircle2 className="h-4 w-4 ml-auto text-primary" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("priority")}>
                  <Flag className="h-4 w-4 mr-2" /> Prioridade
                  {sortBy === "priority" && <CheckCircle2 className="h-4 w-4 ml-auto text-primary" />}
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
            <Button variant="ghost" size="icon" onClick={() => refetch()} className="h-9 w-9">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "kanban" | "list")}>
              <TabsList className="h-9">
                <TabsTrigger value="kanban" className="gap-1.5 px-3">
                  <LayoutGrid className="h-4 w-4" />
                  Kanban
                </TabsTrigger>
                <TabsTrigger value="list" className="gap-1.5 px-3">
                  <List className="h-4 w-4" />
                  Lista
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Content - Kanban with horizontal scroll */}
      <div className="flex-1 px-6 pb-6 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : viewMode === "kanban" ? (
          <ScrollArea className="h-full w-full">
            <div className="flex gap-4 pb-4 min-w-max">
              {columns.map((column) => {
                const config = statusConfig[column.id];
                const columnTasks = tasksByStatus[column.id];
                
                return (
                  <div key={column.id} className="w-[320px] flex-shrink-0">
                    <Card className={cn("h-full border-t-4", config.borderColor)}>
                      {/* Column Header */}
                      <div className={cn("p-3 border-b", config.lightBg)}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge className={cn("px-2.5 py-0.5", config.bgColor, config.textColor)}>
                              {columnTasks.length}
                            </Badge>
                            <h3 className="font-semibold text-sm">{column.label}</h3>
                          </div>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                            setEditingTask(null);
                            setIsFormOpen(true);
                          }}>
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Column Content */}
                      <ScrollArea className="h-[calc(100vh-420px)] min-h-[300px]">
                        <div className="p-2 space-y-2">
                          {columnTasks.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground text-sm">
                              Nenhuma tarefa
                            </div>
                          ) : (
                            columnTasks.map((task) => {
                              const dueDateInfo = getDueDateInfo(task.due_date, task.status);
                              const priorityCfg = priorityConfig[task.priority as 1 | 2 | 3];

                              return (
                                <Card
                                  key={task.id}
                                  className={cn(
                                    "p-3 cursor-pointer hover:shadow-lg transition-all group border-l-4",
                                    task.priority === 3 && task.status !== "done" 
                                      ? "border-l-rose-500 bg-rose-50/50 dark:bg-rose-950/20" 
                                      : dueDateInfo?.isOverdue 
                                        ? "border-l-rose-500 bg-rose-50/30 dark:bg-rose-950/10"
                                        : "border-l-transparent"
                                  )}
                                  onClick={() => {
                                    setSelectedTask(task);
                                    setIsDetailOpen(true);
                                  }}
                                >
                                  {/* Priority + Actions */}
                                  <div className="flex items-start justify-between gap-2 mb-2">
                                    <Badge 
                                      variant="secondary" 
                                      className={cn("text-[10px] px-1.5 py-0", priorityCfg?.bgColor, priorityCfg?.color)}
                                    >
                                      <Flag className="h-2.5 w-2.5 mr-1" />
                                      {priorityCfg?.label}
                                    </Badge>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100">
                                          <MoreVertical className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={(e) => { 
                                          e.stopPropagation();
                                          setSelectedTask(task);
                                          setIsDetailOpen(true);
                                        }}>
                                          <Eye className="h-4 w-4 mr-2" /> Ver Detalhes
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={(e) => { 
                                          e.stopPropagation();
                                          setEditingTask(task);
                                          setIsFormOpen(true);
                                        }}>
                                          <Edit className="h-4 w-4 mr-2" /> Editar
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem 
                                          onClick={(e) => { 
                                            e.stopPropagation();
                                            deleteTaskMutation.mutate(task.id);
                                          }}
                                          className="text-destructive"
                                        >
                                          <Trash2 className="h-4 w-4 mr-2" /> Excluir
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>

                                  {/* Title */}
                                  <p className={cn(
                                    "font-medium text-sm mb-1 line-clamp-2",
                                    task.status === "done" && "line-through text-muted-foreground"
                                  )}>
                                    {task.title}
                                  </p>

                                  {/* Category */}
                                  {task.category && (
                                    <p className="text-xs text-muted-foreground mb-2">{task.category}</p>
                                  )}

                                  {/* Tags */}
                                  {task.tags && task.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mb-2">
                                      {task.tags.slice(0, 2).map((tag) => (
                                        <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0">
                                          #{tag}
                                        </Badge>
                                      ))}
                                    </div>
                                  )}

                                  {/* Footer */}
                                  <div className="flex items-center justify-between pt-2 border-t mt-2">
                                    <div className="flex items-center gap-2">
                                      {dueDateInfo && (
                                        <div className={cn(
                                          "flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded",
                                          dueDateInfo.isOverdue 
                                            ? "bg-rose-500 text-white" 
                                            : dueDateInfo.isDueToday 
                                              ? "bg-amber-500 text-white"
                                              : "text-muted-foreground"
                                        )}>
                                          {dueDateInfo.isOverdue ? (
                                            <AlertTriangle className="h-3 w-3" />
                                          ) : (
                                            <CalendarClock className="h-3 w-3" />
                                          )}
                                          {dueDateInfo.text}
                                        </div>
                                      )}
                                      
                                      {task.subtasks_count ? (
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                          <CheckSquare className="h-3 w-3" />
                                          {task.subtasks_completed}/{task.subtasks_count}
                                        </div>
                                      ) : null}
                                    </div>

                                    {task.assigned_to_name && (
                                      <Avatar className="h-6 w-6">
                                        <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-medium">
                                          {getInitials(task.assigned_to_name)}
                                        </AvatarFallback>
                                      </Avatar>
                                    )}
                                  </div>
                                </Card>
                              );
                            })
                          )}
                        </div>
                      </ScrollArea>
                    </Card>
                  </div>
                );
              })}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        ) : (
          /* List View */
          <Card className="h-full overflow-hidden">
            <ScrollArea className="h-full">
              <div className="divide-y">
                {filteredTasks.length === 0 ? (
                  <div className="text-center py-20 text-muted-foreground">
                    Nenhuma tarefa encontrada
                  </div>
                ) : (
                  filteredTasks.map((task) => {
                    const dueDateInfo = getDueDateInfo(task.due_date, task.status);
                    const priorityCfg = priorityConfig[task.priority as 1 | 2 | 3];
                    const statusCfg = statusConfig[task.status as TaskStatus];

                    return (
                      <div
                        key={task.id}
                        className={cn(
                          "p-4 hover:bg-muted/50 cursor-pointer transition-colors flex items-center gap-4",
                          task.priority === 3 && task.status !== "done" && "bg-rose-50/50 dark:bg-rose-950/20",
                          dueDateInfo?.isOverdue && "bg-rose-50/30 dark:bg-rose-950/10"
                        )}
                        onClick={() => {
                          setSelectedTask(task);
                          setIsDetailOpen(true);
                        }}
                      >
                        {/* Priority indicator */}
                        <div className={cn("w-1.5 h-12 rounded-full", priorityCfg?.solidBg)} />

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className={cn(
                              "font-medium truncate",
                              task.status === "done" && "line-through text-muted-foreground"
                            )}>
                              {task.title}
                            </p>
                            {task.category && (
                              <Badge variant="outline" className="text-[10px] shrink-0">{task.category}</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <Badge className={cn("text-[10px]", statusCfg?.bgColor, statusCfg?.textColor)}>
                              {statusCfg?.label}
                            </Badge>
                            {dueDateInfo && (
                              <span className={cn(
                                "flex items-center gap-1",
                                dueDateInfo.isOverdue && "text-rose-600 font-medium",
                                dueDateInfo.isDueToday && "text-amber-600 font-medium"
                              )}>
                                {dueDateInfo.isOverdue ? <AlertTriangle className="h-3 w-3" /> : <Calendar className="h-3 w-3" />}
                                {dueDateInfo.text}
                              </span>
                            )}
                            {task.subtasks_count ? (
                              <span className="flex items-center gap-1">
                                <CheckSquare className="h-3 w-3" />
                                {task.subtasks_completed}/{task.subtasks_count}
                              </span>
                            ) : null}
                          </div>
                        </div>

                        {/* Assignee */}
                        {task.assigned_to_name && (
                          <div className="flex items-center gap-2 shrink-0">
                            <Avatar className="h-7 w-7">
                              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                {getInitials(task.assigned_to_name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm hidden md:inline">{task.assigned_to_name}</span>
                          </div>
                        )}

                        {/* Actions */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { 
                              e.stopPropagation();
                              setEditingTask(task);
                              setIsFormOpen(true);
                            }}>
                              <Edit className="h-4 w-4 mr-2" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={(e) => { 
                                e.stopPropagation();
                                deleteTaskMutation.mutate(task.id);
                              }}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </Card>
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
        onEdit={(task) => {
          setEditingTask(task);
          setIsFormOpen(true);
        }}
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
          3: { label: "Alta", color: "text-rose-500", icon: Flag } 
        }}
      />
    </div>
  );
}
