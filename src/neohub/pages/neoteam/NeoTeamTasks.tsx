import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  AlertCircle, ArrowUp, ArrowRight, ArrowDown, ChevronLeft,
  ChevronRight, MessageCircle, Phone
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { NeoTeamBreadcrumb } from '@/neohub/components/NeoTeamBreadcrumb';
import { useNeoTeamTasks, Task, TaskStatus, TaskPriority, NewTask } from '@/neohub/hooks/useNeoTeamTasks';

const statusConfig: Record<TaskStatus, { label: string; color: string; bg: string }> = {
  todo: { label: 'A Fazer', color: 'text-slate-600', bg: 'bg-slate-100 dark:bg-slate-800' },
  in_progress: { label: 'Em Andamento', color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  review: { label: 'Em Revisão', color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30' },
  done: { label: 'Concluído', color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' },
  blocked: { label: 'Bloqueado', color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' },
};

const priorityConfig: Record<TaskPriority, { label: string; icon: React.ElementType; color: string }> = {
  low: { label: 'Baixa', icon: ArrowDown, color: 'text-slate-500' },
  medium: { label: 'Média', icon: ArrowRight, color: 'text-blue-500' },
  high: { label: 'Alta', icon: ArrowUp, color: 'text-orange-500' },
  urgent: { label: 'Urgente', icon: AlertCircle, color: 'text-red-500' },
};

const statusColumns: TaskStatus[] = ['todo', 'in_progress', 'review', 'done'];

export default function NeoTeamTasks() {
  const [view, setView] = useState<'list' | 'kanban'>('kanban');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [newTask, setNewTask] = useState<NewTask>({
    title: '',
    description: '',
    priority: 'medium',
    status: 'todo',
  });

  const { tasks, isLoading, createTask, updateTask, deleteTask, moveTask } = useNeoTeamTasks();

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

  const getTasksByStatus = (status: TaskStatus) => tasks.filter(t => t.status === status);

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

  const TaskCard = ({ task }: { task: Task }) => {
    const PriorityIcon = priorityConfig[task.priority].icon;
    const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';
    const patientInfo = extractPatientInfo(task.description);

    // Get next status for quick move
    const getNextStatus = (): TaskStatus | null => {
      const currentIndex = statusColumns.indexOf(task.status);
      if (currentIndex < statusColumns.length - 1) {
        return statusColumns[currentIndex + 1];
      }
      return null;
    };

    const getPrevStatus = (): TaskStatus | null => {
      const currentIndex = statusColumns.indexOf(task.status);
      if (currentIndex > 0) {
        return statusColumns[currentIndex - 1];
      }
      return null;
    };

    const nextStatus = getNextStatus();
    const prevStatus = getPrevStatus();

    return (
      <Card className={`hover:shadow-lg transition-all border-l-4 ${
        task.priority === 'urgent' ? 'border-l-red-500' :
        task.priority === 'high' ? 'border-l-orange-500' :
        task.priority === 'medium' ? 'border-l-blue-500' :
        'border-l-slate-300'
      } ${task.status === 'done' ? 'opacity-60' : ''}`}>
        <CardContent className="p-4">
          {/* Header with priority and menu */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <PriorityIcon className={`h-4 w-4 ${priorityConfig[task.priority].color}`} />
              <Badge variant="outline" className={`text-[10px] ${priorityConfig[task.priority].color}`}>
                {priorityConfig[task.priority].label}
              </Badge>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover">
                <DropdownMenuItem onClick={() => handleEditTask(task)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-destructive"
                  onClick={() => setDeletingTask(task)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Title */}
          <p className={`font-semibold text-sm mb-2 ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
            {task.title}
          </p>

          {/* Patient Info */}
          {patientInfo.name && (
            <div className="flex items-center gap-2 mb-2 p-2 bg-muted/50 rounded-md">
              <User className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">{patientInfo.name}</span>
            </div>
          )}

          {/* Description */}
          {task.description && !patientInfo.name && (
            <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{task.description}</p>
          )}

          {/* Meta info */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              {task.due_date && (
                <span className={`text-xs flex items-center gap-1 px-2 py-0.5 rounded-full ${
                  isOverdue 
                    ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  <Calendar className="h-3 w-3" />
                  {format(new Date(task.due_date), 'dd/MM')}
                </span>
              )}
            </div>
            {task.assignee_name && (
              <Badge variant="secondary" className="text-[10px]">
                {task.assignee_name.split(' ')[0]}
              </Badge>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2 border-t">
            {/* Move buttons */}
            {prevStatus && task.status !== 'done' && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs gap-1"
                onClick={() => moveTask(task.id, prevStatus)}
                title={`Mover para ${statusConfig[prevStatus].label}`}
              >
                <ChevronLeft className="h-3 w-3" />
              </Button>
            )}
            
            {/* Complete button */}
            {task.status !== 'done' ? (
              <Button
                variant="outline"
                size="sm"
                className="h-8 flex-1 text-xs gap-1 bg-green-50 hover:bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:hover:bg-green-900/30 dark:text-green-400 dark:border-green-800"
                onClick={() => moveTask(task.id, 'done')}
              >
                <CheckCircle2 className="h-3 w-3" />
                Concluir
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="h-8 flex-1 text-xs gap-1"
                onClick={() => moveTask(task.id, 'todo')}
              >
                Reabrir
              </Button>
            )}

            {nextStatus && task.status !== 'done' && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs gap-1"
                onClick={() => moveTask(task.id, nextStatus)}
                title={`Mover para ${statusConfig[nextStatus].label}`}
              >
                <ChevronRight className="h-3 w-3" />
              </Button>
            )}

            {/* WhatsApp button */}
            {patientInfo.phone && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2 bg-green-50 hover:bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:hover:bg-green-900/30 dark:text-green-400 dark:border-green-800"
                onClick={() => openWhatsApp(patientInfo.phone!)}
                title="Falar no WhatsApp"
              >
                <MessageCircle className="h-4 w-4" />
              </Button>
            )}
          </div>
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
    <div className="p-4 lg:p-6 space-y-6">
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
                      <SelectContent>
                        {Object.entries(priorityConfig).map(([key, config]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              <config.icon className={`h-4 w-4 ${config.color}`} />
                              {config.label}
                            </div>
                          </SelectItem>
                        ))}
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
                      <SelectContent>
                        {Object.entries(statusConfig).map(([key, config]) => (
                          <SelectItem key={key} value={key}>
                            {config.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Data de Entrega</Label>
                    <Input
                      type="date"
                      value={newTask.due_date || ''}
                      onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Responsável</Label>
                    <Input
                      placeholder="Nome"
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

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {Object.entries(statusConfig).map(([status, config]) => {
          const count = getTasksByStatus(status as TaskStatus).length;
          return (
            <Card key={status}>
              <CardContent className="p-3">
                <p className="text-2xl font-bold">{count}</p>
                <p className={`text-sm ${config.color}`}>{config.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Kanban View */}
      {view === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statusColumns.map((status) => {
            const columnTasks = getTasksByStatus(status);
            const config = statusConfig[status];

            return (
              <div key={status} className="space-y-3">
                <div className={`p-3 rounded-lg ${config.bg}`}>
                  <div className="flex items-center justify-between">
                    <h3 className={`font-semibold text-sm ${config.color}`}>
                      {config.label}
                    </h3>
                    <Badge variant="secondary" className="text-xs">
                      {columnTasks.length}
                    </Badge>
                  </div>
                </div>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-3 pr-2">
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
              {tasks.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  Nenhuma tarefa cadastrada
                </div>
              ) : (
                tasks.map((task) => {
                  const PriorityIcon = priorityConfig[task.priority].icon;
                  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';

                  return (
                    <div
                      key={task.id}
                      className={`flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors ${
                        task.status === 'done' ? 'opacity-60' : ''
                      }`}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0"
                        onClick={() => moveTask(task.id, task.status === 'done' ? 'todo' : 'done')}
                      >
                        <CheckCircle2
                          className={`h-5 w-5 ${
                            task.status === 'done' ? 'text-green-500' : 'text-muted-foreground'
                          }`}
                        />
                      </Button>
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="text-sm text-muted-foreground truncate">{task.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <Badge variant="secondary" className={`${statusConfig[task.status].bg} ${statusConfig[task.status].color}`}>
                          {statusConfig[task.status].label}
                        </Badge>
                        <PriorityIcon className={`h-4 w-4 ${priorityConfig[task.priority].color}`} />
                        {task.due_date && (
                          <span className={`text-sm flex items-center gap-1 ${isOverdue ? 'text-red-500' : 'text-muted-foreground'}`}>
                            <Calendar className="h-4 w-4" />
                            {format(new Date(task.due_date), 'dd/MM/yyyy')}
                          </span>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditTask(task)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setDeletingTask(task)}
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

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingTask} onOpenChange={() => setDeletingTask(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Tarefa</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a tarefa "{deletingTask?.title}"?
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
