import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Plus, List, Kanban, Calendar, Flag, Clock, User, 
  MoreVertical, Trash2, Edit, CheckCircle2, Loader2,
  AlertCircle, ArrowUp, ArrowRight, ArrowDown, 
  MessageCircle, Filter, ArrowUpDown, Search, X, Eye
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { NeoTeamBreadcrumb } from '@/neohub/components/NeoTeamBreadcrumb';
import { useNeoTeamTasks, Task, TaskStatus, TaskPriority, NewTask } from '@/neohub/hooks/useNeoTeamTasks';

// Updated status config with correct colors
const statusConfig: Record<TaskStatus, { label: string; color: string; bg: string; headerBg: string }> = {
  todo: { label: 'A Fazer', color: 'text-slate-600', bg: 'bg-slate-50 dark:bg-slate-900/50', headerBg: 'bg-slate-100 dark:bg-slate-800' },
  in_progress: { label: 'Em Andamento', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20', headerBg: 'bg-amber-100 dark:bg-amber-900/40' },
  review: { label: 'Em Revisão', color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20', headerBg: 'bg-purple-100 dark:bg-purple-900/40' },
  done: { label: 'Concluído', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', headerBg: 'bg-emerald-100 dark:bg-emerald-900/40' },
  blocked: { label: 'Bloqueado', color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20', headerBg: 'bg-red-100 dark:bg-red-900/40' },
};

const priorityConfig: Record<TaskPriority, { label: string; icon: React.ElementType; color: string; bgColor: string }> = {
  low: { label: 'Baixa', icon: ArrowDown, color: 'text-slate-500', bgColor: 'bg-slate-100 dark:bg-slate-800' },
  medium: { label: 'Normal', icon: ArrowRight, color: 'text-blue-500', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  high: { label: 'Alta', icon: ArrowUp, color: 'text-orange-500', bgColor: 'bg-orange-100 dark:bg-orange-900/30' },
  urgent: { label: 'Urgente', icon: AlertCircle, color: 'text-red-500', bgColor: 'bg-red-100 dark:bg-red-900/30' },
};

const statusColumns: TaskStatus[] = ['todo', 'in_progress', 'review', 'done'];

type SortOption = 'priority' | 'due_date' | 'created_at' | 'title';

export default function NeoTeamTasks() {
  const [view, setView] = useState<'list' | 'kanban'>('kanban');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('priority');
  const [newTask, setNewTask] = useState<NewTask>({
    title: '',
    description: '',
    priority: 'medium',
    status: 'todo',
  });

  const { tasks, isLoading, createTask, updateTask, deleteTask, moveTask } = useNeoTeamTasks();

  // Filter and sort tasks
  const filteredTasks = useMemo(() => {
    let result = [...tasks];
    
    // Search filter
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(t => 
        t.title.toLowerCase().includes(lower) ||
        t.description?.toLowerCase().includes(lower) ||
        t.assignee_name?.toLowerCase().includes(lower)
      );
    }
    
    // Priority filter
    if (priorityFilter !== 'all') {
      result = result.filter(t => t.priority === priorityFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(t => t.status === statusFilter);
    }
    
    // Sort
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    result.sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        case 'due_date':
          if (!a.due_date && !b.due_date) return 0;
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        case 'created_at':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });
    
    return result;
  }, [tasks, searchTerm, priorityFilter, statusFilter, sortBy]);

  const getTasksByStatus = (status: TaskStatus) => filteredTasks.filter(t => t.status === status);

  const handleSaveTask = async () => {
    if (!newTask.title) return;

    try {
      if (editingTask) {
        await updateTask(editingTask.id, newTask);
      } else {
        await createTask(newTask);
      }
      setDialogOpen(false);
      setEditingTask(null);
      setNewTask({ title: '', description: '', priority: 'medium', status: 'todo' });
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setNewTask({
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      due_date: task.due_date,
      assignee_name: task.assignee_name,
    });
    setDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (deletingTask) {
      await deleteTask(deletingTask.id);
      setDeletingTask(null);
    }
  };

  const openNewTaskDialog = () => {
    setEditingTask(null);
    setNewTask({ title: '', description: '', priority: 'medium', status: 'todo' });
    setDialogOpen(true);
  };

  const openTaskDetail = (task: Task) => {
    setSelectedTask(task);
    setDetailDialogOpen(true);
  };

  // Extract patient info from description
  const extractPatientInfo = (description: string | null): { name?: string; phone?: string } => {
    if (!description) return {};
    const phoneMatch = description.match(/Contato:\s*(\d+)/);
    const nameMatch = description.match(/paciente\s+([^não]+?)\s+não/i) || 
                     description.match(/Paciente:\s*([^\n|]+)/i);
    return {
      name: nameMatch ? nameMatch[1].trim() : undefined,
      phone: phoneMatch ? phoneMatch[1].trim() : undefined,
    };
  };

  const openWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    window.open(`https://wa.me/${formattedPhone}`, '_blank');
  };

  // ClickUp-style Task Card - click to open details
  const TaskCard = ({ task }: { task: Task }) => {
    const PriorityIcon = priorityConfig[task.priority].icon;
    const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';
    const patientInfo = extractPatientInfo(task.description);

    return (
      <Card 
        className={`group cursor-pointer hover:shadow-md transition-all border-l-4 ${
          task.priority === 'urgent' ? 'border-l-red-500' :
          task.priority === 'high' ? 'border-l-orange-500' :
          task.priority === 'medium' ? 'border-l-blue-500' :
          'border-l-slate-300'
        } ${task.status === 'done' ? 'opacity-60' : ''}`}
        onClick={() => openTaskDetail(task)}
      >
        <CardContent className="p-3">
          {/* Title */}
          <p className={`font-medium text-sm mb-2 line-clamp-2 ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
            {task.title}
          </p>

          {/* Patient Name if available */}
          {patientInfo.name && (
            <div className="flex items-center gap-1.5 mb-2 text-xs text-muted-foreground">
              <User className="h-3 w-3" />
              <span className="truncate">{patientInfo.name}</span>
            </div>
          )}

          {/* Meta row */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {/* Due date */}
              {task.due_date && (
                <span className={`text-[11px] flex items-center gap-1 px-1.5 py-0.5 rounded ${
                  isOverdue 
                    ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  <Calendar className="h-3 w-3" />
                  {format(new Date(task.due_date), 'dd MMM', { locale: ptBR })}
                </span>
              )}
              
              {/* Priority badge */}
              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 gap-1 ${priorityConfig[task.priority].color}`}>
                <PriorityIcon className="h-3 w-3" />
                {priorityConfig[task.priority].label}
              </Badge>
            </div>

            {/* Actions - 3 dots menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEditTask(task); }}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-destructive"
                  onClick={(e) => { e.stopPropagation(); setDeletingTask(task); }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Assignee */}
          {task.assignee_name && (
            <div className="mt-2 pt-2 border-t">
              <Badge variant="secondary" className="text-[10px]">
                {task.assignee_name.split(' ')[0]}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-4">
      {/* Breadcrumb */}
      <NeoTeamBreadcrumb />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Tarefas</h1>
          <p className="text-muted-foreground">Gerencie as tarefas da equipe</p>
        </div>
        <div className="flex items-center gap-3">
          <Tabs value={view} onValueChange={(v) => setView(v as 'list' | 'kanban')}>
            <TabsList>
              <TabsTrigger value="kanban" className="gap-2">
                <Kanban className="h-4 w-4" />
                Kanban
              </TabsTrigger>
              <TabsTrigger value="list" className="gap-2">
                <List className="h-4 w-4" />
                Lista
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNewTaskDialog} className="gap-2">
                <Plus className="h-4 w-4" />
                Nova Tarefa
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingTask ? 'Editar Tarefa' : 'Nova Tarefa'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Título *</Label>
                  <Input
                    placeholder="Título da tarefa"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea
                    placeholder="Descrição da tarefa"
                    value={newTask.description || ''}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Prioridade</Label>
                    <Select
                      value={newTask.priority}
                      onValueChange={(v) => setNewTask({ ...newTask, priority: v as TaskPriority })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover">
                        <SelectItem value="low">Baixa</SelectItem>
                        <SelectItem value="medium">Normal</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="urgent">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={newTask.status}
                      onValueChange={(v) => setNewTask({ ...newTask, status: v as TaskStatus })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover">
                        {Object.entries(statusConfig).map(([key, val]) => (
                          <SelectItem key={key} value={key}>{val.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Prazo</Label>
                    <Input
                      type="date"
                      value={newTask.due_date || ''}
                      onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Responsável</Label>
                    <Input
                      placeholder="Nome do responsável"
                      value={newTask.assignee_name || ''}
                      onChange={(e) => setNewTask({ ...newTask, assignee_name: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveTask} disabled={!newTask.title}>
                    {editingTask ? 'Salvar' : 'Criar'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters & Stats Bar - ClickUp style */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 bg-muted/30 rounded-lg border">
        {/* Stats - Clickable as filters */}
        <div className="flex items-center gap-4 overflow-x-auto">
          {statusColumns.map((status) => {
            const count = tasks.filter(t => t.status === status).length;
            const config = statusConfig[status];
            const isActive = statusFilter === status;
            return (
              <button 
                key={status} 
                onClick={() => setStatusFilter(isActive ? 'all' : status)}
                className={`flex items-center gap-2 shrink-0 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  isActive 
                    ? `${config.headerBg} ring-2 ring-offset-2 ring-offset-background ring-current ${config.color}` 
                    : 'hover:bg-muted/50'
                }`}
              >
                <span className={`text-xl font-bold ${config.color}`}>{count}</span>
                <span className={`text-sm ${isActive ? config.color : 'text-muted-foreground'}`}>{config.label}</span>
              </button>
            );
          })}
          {statusFilter !== 'all' && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setStatusFilter('all')}
              className="text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Limpar
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar tarefas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-48 h-9"
            />
            {searchTerm && (
              <Button 
                variant="ghost" 
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                onClick={() => setSearchTerm('')}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          {/* Priority Filter */}
          <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as TaskPriority | 'all')}>
            <SelectTrigger className="w-32 h-9 gap-2">
              <Filter className="h-4 w-4" />
              <SelectValue placeholder="Prioridade" />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="urgent">Urgente</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
              <SelectItem value="medium">Normal</SelectItem>
              <SelectItem value="low">Baixa</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-36 h-9 gap-2">
              <ArrowUpDown className="h-4 w-4" />
              <SelectValue placeholder="Ordenar" />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value="priority">Prioridade</SelectItem>
              <SelectItem value="due_date">Prazo</SelectItem>
              <SelectItem value="created_at">Data criação</SelectItem>
              <SelectItem value="title">Título</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Kanban View */}
      {view === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statusColumns.map((status) => {
            const columnTasks = getTasksByStatus(status);
            const config = statusConfig[status];

            return (
              <div key={status} className="flex flex-col">
                {/* Column Header */}
                <div className={`p-3 rounded-t-lg ${config.headerBg} border-b-2 ${
                  status === 'todo' ? 'border-slate-400' :
                  status === 'in_progress' ? 'border-amber-400' :
                  status === 'review' ? 'border-purple-400' :
                  'border-emerald-400'
                }`}>
                  <div className="flex items-center justify-between">
                    <h3 className={`font-semibold text-sm ${config.color}`}>
                      {config.label}
                    </h3>
                    <Badge variant="secondary" className={`text-xs ${config.color}`}>
                      {columnTasks.length}
                    </Badge>
                  </div>
                </div>
                
                {/* Column Content - Fixed height showing ~5 cards */}
                <div className={`flex-1 rounded-b-lg ${config.bg} p-2`}>
                  <ScrollArea className="h-[calc(100vh-380px)] min-h-[400px]">
                    <div className="space-y-2 pr-2">
                      {columnTasks.map((task) => (
                        <TaskCard key={task.id} task={task} />
                      ))}
                      {columnTasks.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                          Nenhuma tarefa
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                  
                  {/* Add Task Button */}
                  <Button 
                    variant="ghost" 
                    className="w-full mt-2 gap-2 text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      setNewTask({ ...newTask, status });
                      openNewTaskDialog();
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    Adicionar Tarefa
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {view === 'list' && (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {filteredTasks.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  Nenhuma tarefa encontrada
                </div>
              ) : (
                filteredTasks.map((task) => {
                  const PriorityIcon = priorityConfig[task.priority].icon;
                  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';
                  const patientInfo = extractPatientInfo(task.description);

                  return (
                    <div
                      key={task.id}
                      className={`flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors cursor-pointer ${
                        task.status === 'done' ? 'opacity-60' : ''
                      }`}
                      onClick={() => openTaskDetail(task)}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0"
                        onClick={(e) => { e.stopPropagation(); moveTask(task.id, task.status === 'done' ? 'todo' : 'done'); }}
                      >
                        <CheckCircle2
                          className={`h-5 w-5 ${
                            task.status === 'done' ? 'text-emerald-500' : 'text-muted-foreground'
                          }`}
                        />
                      </Button>

                      <div className="flex-1 min-w-0">
                        <p className={`font-medium ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
                          {task.title}
                        </p>
                        {patientInfo.name && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <User className="h-3 w-3" />
                            {patientInfo.name}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <Badge className={`${statusConfig[task.status].bg} ${statusConfig[task.status].color} text-xs`}>
                          {statusConfig[task.status].label}
                        </Badge>
                        <Badge variant="outline" className={`gap-1 ${priorityConfig[task.priority].color}`}>
                          <PriorityIcon className="h-3 w-3" />
                          {priorityConfig[task.priority].label}
                        </Badge>
                        {task.due_date && (
                          <span className={`text-xs flex items-center gap-1 ${isOverdue ? 'text-red-500' : 'text-muted-foreground'}`}>
                            <Calendar className="h-3 w-3" />
                            {format(new Date(task.due_date), 'dd/MM')}
                          </span>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-popover">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEditTask(task); }}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={(e) => { e.stopPropagation(); setDeletingTask(task); }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Task Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Detalhes da Tarefa
            </DialogTitle>
          </DialogHeader>
          {selectedTask && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{selectedTask.title}</h3>
                {selectedTask.description && (
                  <p className="text-muted-foreground mt-2">{selectedTask.description}</p>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <Badge className={`mt-1 ${statusConfig[selectedTask.status].bg} ${statusConfig[selectedTask.status].color}`}>
                    {statusConfig[selectedTask.status].label}
                  </Badge>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Prioridade</Label>
                  <Badge variant="outline" className={`mt-1 gap-1 ${priorityConfig[selectedTask.priority].color}`}>
                    {React.createElement(priorityConfig[selectedTask.priority].icon, { className: "h-3 w-3" })}
                    {priorityConfig[selectedTask.priority].label}
                  </Badge>
                </div>
                {selectedTask.due_date && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Prazo</Label>
                    <p className="mt-1 text-sm flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(selectedTask.due_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                  </div>
                )}
                {selectedTask.assignee_name && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Responsável</Label>
                    <p className="mt-1 text-sm flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {selectedTask.assignee_name}
                    </p>
                  </div>
                )}
              </div>

              {/* Patient Info */}
              {extractPatientInfo(selectedTask.description).phone && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <Label className="text-xs text-muted-foreground">Contato do Paciente</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm">{extractPatientInfo(selectedTask.description).phone}</span>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="gap-1 text-emerald-600"
                      onClick={() => openWhatsApp(extractPatientInfo(selectedTask.description).phone!)}
                    >
                      <MessageCircle className="h-4 w-4" />
                      WhatsApp
                    </Button>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    setDetailDialogOpen(false);
                    handleEditTask(selectedTask);
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                {selectedTask.status !== 'done' ? (
                  <Button 
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => {
                      moveTask(selectedTask.id, 'done');
                      setDetailDialogOpen(false);
                    }}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Concluir
                  </Button>
                ) : (
                  <Button 
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      moveTask(selectedTask.id, 'todo');
                      setDetailDialogOpen(false);
                    }}
                  >
                    Reabrir
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingTask} onOpenChange={() => setDeletingTask(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir tarefa?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{deletingTask?.title}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
