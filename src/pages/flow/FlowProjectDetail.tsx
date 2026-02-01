/**
 * FlowProjectDetail - Página de detalhes do projeto com views
 */

import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useFlowProjects, useFlowTasks, useFlowStatuses } from "@/hooks/flow";
import { FlowViewType, FlowFilters } from "@/types/flow";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ChevronLeft, 
  List, 
  LayoutGrid, 
  Calendar, 
  Plus,
  Settings,
  Users
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ListView } from "@/components/flow/views/ListView";
import { KanbanView } from "@/components/flow/views/KanbanView";
import { TaskFormDialog } from "@/components/flow/tasks/TaskFormDialog";
import { TaskDetailSheet } from "@/components/flow/tasks/TaskDetailSheet";

export default function FlowProjectDetail() {
  const { projectId } = useParams();
  const { useProject } = useFlowProjects();
  const { data: project, isLoading: projectLoading } = useProject(projectId);
  const { statuses } = useFlowStatuses(projectId);
  
  const [viewType, setViewType] = useState<FlowViewType>('kanban');
  const [filters, setFilters] = useState<FlowFilters>({});
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const { tasks, isLoading: tasksLoading } = useFlowTasks(projectId, filters);

  if (projectLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[600px]" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-medium mb-2">Projeto não encontrado</h2>
        <Button asChild variant="outline">
          <Link to="/flow/projects">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Voltar para Projetos
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/flow/projects">
              <ChevronLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <div 
              className="w-6 h-6 rounded" 
              style={{ backgroundColor: project.color }}
            />
            <div>
              <h1 className="text-2xl font-bold">{project.name}</h1>
              {project.description && (
                <p className="text-sm text-muted-foreground">{project.description}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon">
            <Users className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Tarefa
          </Button>
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex items-center justify-between">
        <Tabs value={viewType} onValueChange={(v) => setViewType(v as FlowViewType)}>
          <TabsList>
            <TabsTrigger value="kanban" className="gap-2">
              <LayoutGrid className="h-4 w-4" />
              Quadro
            </TabsTrigger>
            <TabsTrigger value="list" className="gap-2">
              <List className="h-4 w-4" />
              Lista
            </TabsTrigger>
            <TabsTrigger value="calendar" className="gap-2">
              <Calendar className="h-4 w-4" />
              Calendário
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      <div className="min-h-[500px]">
        {viewType === 'kanban' && (
          <KanbanView 
            projectId={projectId!}
            statuses={statuses}
            tasks={tasks}
            isLoading={tasksLoading}
            onTaskClick={(taskId) => setSelectedTaskId(taskId)}
            onCreateTask={(statusId) => {
              setFilters(prev => ({ ...prev, status_id: statusId }));
              setCreateDialogOpen(true);
            }}
          />
        )}
        {viewType === 'list' && (
          <ListView 
            tasks={tasks}
            isLoading={tasksLoading}
            onTaskClick={(taskId) => setSelectedTaskId(taskId)}
          />
        )}
        {viewType === 'calendar' && (
          <div className="text-center py-12 text-muted-foreground">
            Visualização de calendário em desenvolvimento
          </div>
        )}
      </div>

      {/* Create Task Dialog */}
      <TaskFormDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        projectId={projectId!}
        statuses={statuses}
        defaultStatusId={filters.status_id}
      />

      {/* Task Detail Sheet */}
      <TaskDetailSheet
        taskId={selectedTaskId}
        open={!!selectedTaskId}
        onOpenChange={(open) => !open && setSelectedTaskId(null)}
        projectId={projectId!}
        statuses={statuses}
      />
    </div>
  );
}
