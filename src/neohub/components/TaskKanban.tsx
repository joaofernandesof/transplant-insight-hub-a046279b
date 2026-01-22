import React, { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Calendar, User, MoreVertical, Edit, Trash2,
  ArrowUp, ArrowRight, ArrowDown, AlertCircle,
  Plus, Phone, Mail, MapPin, ExternalLink, GripVertical
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { Task, TaskStatus, TaskPriority } from '@/neohub/hooks/useNeoTeamTasks';

const statusConfig: Record<TaskStatus, { label: string; color: string; bg: string; headerBg: string }> = {
  todo: { label: 'A Fazer', color: 'text-slate-600', bg: 'bg-slate-50 dark:bg-slate-900/50', headerBg: 'bg-slate-100 dark:bg-slate-800' },
  in_progress: { label: 'Em Andamento', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20', headerBg: 'bg-amber-100 dark:bg-amber-900/40' },
  done: { label: 'Concluído', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', headerBg: 'bg-emerald-100 dark:bg-emerald-900/40' },
  cancelled: { label: 'Cancelados', color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20', headerBg: 'bg-red-100 dark:bg-red-900/40' },
};

const priorityConfig: Record<TaskPriority, { label: string; icon: React.ElementType; color: string }> = {
  low: { label: 'Baixa', icon: ArrowDown, color: 'text-slate-500' },
  medium: { label: 'Normal', icon: ArrowRight, color: 'text-blue-500' },
  high: { label: 'Alta', icon: ArrowUp, color: 'text-orange-500' },
  urgent: { label: 'Urgente', icon: AlertCircle, color: 'text-red-500' },
};

const statusColumns: TaskStatus[] = ['todo', 'in_progress', 'done', 'cancelled'];

interface TaskKanbanProps {
  tasks: Task[];
  onMoveTask: (taskId: string, newStatus: TaskStatus) => Promise<void>;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onOpenDetail: (task: Task) => void;
  onAddTask: (status: TaskStatus) => void;
}

interface SortableTaskCardProps {
  task: Task;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onOpenDetail: (task: Task) => void;
}

function SortableTaskCard({ task, onEditTask, onDeleteTask, onOpenDetail }: SortableTaskCardProps) {
  const navigate = useNavigate();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const PriorityIcon = priorityConfig[task.priority].icon;
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';
  const patient = task.patient;

  const handlePatientClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (patient?.id) {
      navigate(`/neoteam/patients/${patient.id}`);
    }
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`group cursor-pointer hover:shadow-md transition-all border-l-4 ${
        task.priority === 'urgent' ? 'border-l-destructive' :
        task.priority === 'high' ? 'border-l-orange-500' :
        task.priority === 'medium' ? 'border-l-primary' :
        'border-l-muted-foreground/30'
      } ${task.status === 'done' ? 'opacity-60' : ''}`}
    >
      <CardContent className="p-3">
        {/* Drag Handle + Title */}
        <div className="flex items-start gap-2 mb-2">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 -ml-1 rounded hover:bg-muted"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          <p 
            className={`flex-1 font-medium text-sm line-clamp-2 cursor-pointer ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}
            onClick={() => onOpenDetail(task)}
          >
            {task.title}
          </p>
        </div>

        {/* Patient Info */}
        {patient && (
          <div 
            className="mb-2 p-2 rounded-md bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
            onClick={handlePatientClick}
          >
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-primary" />
                <span className="text-sm font-medium truncate">{patient.full_name}</span>
              </div>
              <ExternalLink className="h-3 w-3 text-muted-foreground" />
            </div>
            <div className="grid grid-cols-2 gap-1 text-[10px] text-muted-foreground">
              {patient.phone && (
                <div className="flex items-center gap-1 truncate">
                  <Phone className="h-2.5 w-2.5" />
                  <span>{patient.phone}</span>
                </div>
              )}
              {patient.email && (
                <div className="flex items-center gap-1 truncate">
                  <Mail className="h-2.5 w-2.5" />
                  <span>{patient.email}</span>
                </div>
              )}
              {(patient.address_city || patient.address_state) && (
                <div className="flex items-center gap-1 col-span-2 truncate">
                  <MapPin className="h-2.5 w-2.5" />
                  <span>{[patient.address_city, patient.address_state].filter(Boolean).join('/')}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Meta row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {task.due_date && (
              <span className={`text-[11px] flex items-center gap-1 px-1.5 py-0.5 rounded ${
                isOverdue 
                  ? 'bg-destructive/10 text-destructive' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                <Calendar className="h-3 w-3" />
                {format(new Date(task.due_date), 'dd MMM', { locale: ptBR })}
              </span>
            )}
            
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 gap-1 ${priorityConfig[task.priority].color}`}>
              <PriorityIcon className="h-3 w-3" />
              {priorityConfig[task.priority].label}
            </Badge>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEditTask(task); }}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-destructive"
                onClick={(e) => { e.stopPropagation(); onDeleteTask(task); }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

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
}

function DroppableColumn({ 
  status, 
  tasks: columnTasks, 
  onEditTask, 
  onDeleteTask, 
  onOpenDetail,
  onAddTask 
}: {
  status: TaskStatus;
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onOpenDetail: (task: Task) => void;
  onAddTask: (status: TaskStatus) => void;
}) {
  const config = statusConfig[status];
  
  // Use useDroppable to make the column a valid drop target
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  return (
    <div className="flex flex-col">
      {/* Column Header */}
      <div className={`p-3 rounded-t-lg ${config.headerBg} border-b-2 ${
        status === 'todo' ? 'border-slate-400' :
        status === 'in_progress' ? 'border-amber-400' :
        status === 'done' ? 'border-emerald-400' :
        'border-red-400'
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
      
      {/* Column Content - droppable area */}
      <div 
        ref={setNodeRef}
        className={`flex-1 rounded-b-lg ${config.bg} p-2 transition-all ${
          isOver ? 'ring-2 ring-primary ring-inset bg-primary/5' : ''
        }`}
      >
        <ScrollArea className="h-[calc(100vh-380px)] min-h-[400px]">
          <SortableContext items={columnTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2 pr-2">
              {columnTasks.map((task) => (
                <SortableTaskCard 
                  key={task.id} 
                  task={task} 
                  onEditTask={onEditTask}
                  onDeleteTask={onDeleteTask}
                  onOpenDetail={onOpenDetail}
                />
              ))}
              {columnTasks.length === 0 && (
                <div className={`text-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-lg min-h-[100px] flex items-center justify-center ${
                  isOver ? 'border-primary bg-primary/10' : 'border-muted'
                }`}>
                  Arraste tarefas aqui
                </div>
              )}
            </div>
          </SortableContext>
        </ScrollArea>
        
        <Button 
          variant="ghost" 
          className="w-full mt-2 gap-2 text-muted-foreground hover:text-foreground"
          onClick={() => onAddTask(status)}
        >
          <Plus className="h-4 w-4" />
          Adicionar Tarefa
        </Button>
      </div>
    </div>
  );
}

export function TaskKanban({ 
  tasks, 
  onMoveTask, 
  onEditTask, 
  onDeleteTask, 
  onOpenDetail,
  onAddTask 
}: TaskKanbanProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const getTasksByStatus = (status: TaskStatus) => tasks.filter(t => t.status === status);

  const findContainer = (id: string): TaskStatus | undefined => {
    // Check if ID is a status column
    if (statusColumns.includes(id as TaskStatus)) {
      return id as TaskStatus;
    }
    // Otherwise find the task
    const task = tasks.find(t => t.id === id);
    return task?.status;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find(t => t.id === active.id);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Get the original status of the dragged task
    const task = tasks.find(t => t.id === activeId);
    if (!task) return;
    
    const activeContainer = task.status;
    
    // Determine target container
    let targetContainer: TaskStatus | undefined;
    
    // Check if dropped directly on a column (column ID matches status)
    if (statusColumns.includes(overId as TaskStatus)) {
      targetContainer = overId as TaskStatus;
    } else {
      // Dropped on another task - get that task's status
      const overTask = tasks.find(t => t.id === overId);
      if (overTask) {
        targetContainer = overTask.status;
      }
    }

    if (!targetContainer) return;

    // Only call onMoveTask if status changed
    if (activeContainer !== targetContainer) {
      try {
        await onMoveTask(activeId, targetContainer);
      } catch (error) {
        console.error('Error moving task:', error);
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statusColumns.map((status) => (
          <DroppableColumn
            key={status}
            status={status}
            tasks={getTasksByStatus(status)}
            onEditTask={onEditTask}
            onDeleteTask={onDeleteTask}
            onOpenDetail={onOpenDetail}
            onAddTask={onAddTask}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask ? (
          <Card className="w-64 shadow-lg border-l-4 border-l-primary rotate-3">
            <CardContent className="p-3">
              <p className="font-medium text-sm line-clamp-2">{activeTask.title}</p>
              {activeTask.patient && (
                <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {activeTask.patient.full_name}
                </div>
              )}
            </CardContent>
          </Card>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
