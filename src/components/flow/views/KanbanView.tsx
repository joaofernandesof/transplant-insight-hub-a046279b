/**
 * KanbanView - Visualização Kanban com drag & drop
 */

import { useMemo } from "react";
import { FlowTask, FlowProjectStatus, KanbanColumn } from "@/types/flow";
import { useFlowTasks } from "@/hooks/flow";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Calendar, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";

interface KanbanViewProps {
  projectId: string;
  statuses: FlowProjectStatus[];
  tasks: FlowTask[];
  isLoading: boolean;
  onTaskClick: (taskId: string) => void;
  onCreateTask: (statusId: string) => void;
}

const priorityColors = {
  low: 'bg-muted',
  medium: 'bg-blue-500',
  high: 'bg-orange-500',
  urgent: 'bg-red-500',
};

function TaskCard({ 
  task, 
  onClick,
  isDragging = false 
}: { 
  task: FlowTask; 
  onClick: () => void;
  isDragging?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={cn(
        "cursor-pointer hover:shadow-md transition-shadow",
        isDragging && "opacity-50 shadow-lg"
      )}
    >
      <CardContent className="p-3 space-y-2">
        {/* Priority indicator */}
        <div className="flex items-start justify-between gap-2">
          <p className={cn(
            "text-sm font-medium line-clamp-2",
            task.completed_at && "line-through text-muted-foreground"
          )}>
            {task.title}
          </p>
          <div className={cn(
            "w-2 h-2 rounded-full shrink-0 mt-1",
            priorityColors[task.priority]
          )} />
        </div>

        {/* Meta row */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            {task.due_date && (
              <div className={cn(
                "flex items-center gap-1",
                new Date(task.due_date) < new Date() && !task.completed_at && "text-destructive"
              )}>
                <Calendar className="h-3 w-3" />
                {format(new Date(task.due_date), "dd MMM", { locale: ptBR })}
              </div>
            )}
            {task.comments && task.comments.length > 0 && (
              <div className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                {task.comments.length}
              </div>
            )}
          </div>

          {task.assignee && (
            <Avatar className="h-5 w-5">
              <AvatarImage src={task.assignee.avatar_url || undefined} />
              <AvatarFallback className="text-[10px]">
                {task.assignee.full_name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function KanbanColumnComponent({ 
  column, 
  onTaskClick, 
  onCreateTask 
}: { 
  column: KanbanColumn;
  onTaskClick: (taskId: string) => void;
  onCreateTask: () => void;
}) {
  return (
    <div className="w-72 shrink-0 flex flex-col bg-accent/30 rounded-lg">
      {/* Column Header */}
      <div className="p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: column.status.color }}
          />
          <h3 className="font-medium text-sm">{column.status.name}</h3>
          <Badge variant="secondary" className="text-xs">
            {column.tasks.length}
          </Badge>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onCreateTask}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Cards */}
      <ScrollArea className="flex-1 px-2 pb-2">
        <SortableContext 
          items={column.tasks.map(t => t.id)} 
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {column.tasks.map(task => (
              <TaskCard 
                key={task.id} 
                task={task} 
                onClick={() => onTaskClick(task.id)}
              />
            ))}
          </div>
        </SortableContext>

        {column.tasks.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Nenhuma tarefa
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

export function KanbanView({ 
  projectId,
  statuses, 
  tasks, 
  isLoading, 
  onTaskClick,
  onCreateTask 
}: KanbanViewProps) {
  const { moveTask } = useFlowTasks(projectId);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Organize tasks by status
  const columns: KanbanColumn[] = useMemo(() => {
    return statuses
      .sort((a, b) => a.position - b.position)
      .map(status => ({
        status,
        tasks: tasks
          .filter(t => t.status_id === status.id)
          .sort((a, b) => a.position - b.position),
      }));
  }, [statuses, tasks]);

  const activeTask = activeId ? tasks.find(t => t.id === activeId) : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    // Find which column the task was dropped into
    const overColumn = columns.find(col => 
      col.tasks.some(t => t.id === overId) || col.status.id === overId
    );

    if (!overColumn) return;

    const activeTask = tasks.find(t => t.id === taskId);
    if (!activeTask || activeTask.status_id === overColumn.status.id) return;

    // Calculate new position
    const newPosition = overColumn.tasks.length;

    moveTask({
      taskId,
      newStatusId: overColumn.status.id,
      newPosition,
    });
  };

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="w-72 shrink-0">
            <Skeleton className="h-10 mb-2" />
            <div className="space-y-2">
              {[1, 2, 3].map(j => (
                <Skeleton key={j} className="h-24" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-4 pb-4">
          {columns.map(column => (
            <KanbanColumnComponent
              key={column.status.id}
              column={column}
              onTaskClick={onTaskClick}
              onCreateTask={() => onCreateTask(column.status.id)}
            />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <DragOverlay>
        {activeTask && (
          <Card className="w-72 shadow-xl">
            <CardContent className="p-3">
              <p className="text-sm font-medium">{activeTask.title}</p>
            </CardContent>
          </Card>
        )}
      </DragOverlay>
    </DndContext>
  );
}
