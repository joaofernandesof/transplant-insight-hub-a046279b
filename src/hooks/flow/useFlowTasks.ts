/**
 * useFlowTasks - Hook para gerenciamento de tarefas Flow.do
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FlowTask, CreateTaskForm, UpdateTaskForm, FlowFilters } from "@/types/flow";
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext";

export function useFlowTasks(projectId?: string, filters?: FlowFilters) {
  const queryClient = useQueryClient();
  const { user } = useUnifiedAuth();

  // Buscar tarefas do projeto
  const tasksQuery = useQuery({
    queryKey: ['flow-tasks', projectId, filters],
    queryFn: async () => {
      if (!projectId) return [];
      
      let query = supabase
        .from('flow_tasks')
        .select(`
          *,
          creator:neohub_users!flow_tasks_creator_id_fkey(id, full_name, email, avatar_url),
          assignee:neohub_users!flow_tasks_assignee_id_fkey(id, full_name, email, avatar_url),
          status:flow_project_statuses!flow_tasks_status_id_fkey(id, name, color, icon, position, is_done_status)
        `)
        .eq('project_id', projectId)
        .is('parent_task_id', null) // Apenas tarefas pai
        .order('position', { ascending: true });

      // Aplicar filtros
      if (filters?.status_id) {
        query = query.eq('status_id', filters.status_id);
      }
      if (filters?.assignee_id) {
        query = query.eq('assignee_id', filters.assignee_id);
      }
      if (filters?.priority) {
        query = query.eq('priority', filters.priority);
      }
      if (!filters?.show_completed) {
        query = query.is('completed_at', null);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as FlowTask[];
    },
    enabled: !!projectId,
  });

  // Buscar tarefa específica com subtarefas e comentários
  const useTask = (taskId?: string) => {
    return useQuery({
      queryKey: ['flow-task', taskId],
      queryFn: async () => {
        if (!taskId) return null;
        
        const { data, error } = await supabase
          .from('flow_tasks')
          .select(`
            *,
            creator:neohub_users!flow_tasks_creator_id_fkey(id, full_name, email, avatar_url),
            assignee:neohub_users!flow_tasks_assignee_id_fkey(id, full_name, email, avatar_url),
            status:flow_project_statuses!flow_tasks_status_id_fkey(id, name, color, icon, position, is_done_status),
            subtasks:flow_tasks!flow_tasks_parent_task_id_fkey(
              id, title, completed_at, assignee_id, position
            ),
            comments:flow_task_comments(
              id, content, created_at,
              author:neohub_users(id, full_name, email, avatar_url)
            )
          `)
          .eq('id', taskId)
          .single();

        if (error) throw error;
        return data as FlowTask;
      },
      enabled: !!taskId,
    });
  };

  // Criar tarefa
  const createMutation = useMutation({
    mutationFn: async (form: CreateTaskForm & { project_id: string }) => {
      if (!user?.id) throw new Error("Usuário não autenticado");

      // Pegar a maior position atual
      const { data: maxPos } = await supabase
        .from('flow_tasks')
        .select('position')
        .eq('project_id', form.project_id)
        .eq('status_id', form.status_id || '')
        .order('position', { ascending: false })
        .limit(1)
        .single();

      const newPosition = (maxPos?.position || 0) + 1;

      const { data, error } = await supabase
        .from('flow_tasks')
        .insert({
          project_id: form.project_id,
          creator_id: user.id,
          title: form.title,
          description: form.description || null,
          priority: form.priority || 'medium',
          assignee_id: form.assignee_id || null,
          status_id: form.status_id || null,
          due_date: form.due_date || null,
          parent_task_id: form.parent_task_id || null,
          position: newPosition,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['flow-tasks', data.project_id] });
      toast.success("Tarefa criada!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao criar tarefa", { description: error.message });
    },
  });

  // Atualizar tarefa
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: UpdateTaskForm) => {
      const { data, error } = await supabase
        .from('flow_tasks')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['flow-tasks', data.project_id] });
      queryClient.invalidateQueries({ queryKey: ['flow-task', data.id] });
    },
    onError: (error: Error) => {
      toast.error("Erro ao atualizar tarefa", { description: error.message });
    },
  });

  // Mover tarefa (Kanban drag & drop)
  const moveMutation = useMutation({
    mutationFn: async ({ taskId, newStatusId, newPosition }: { 
      taskId: string; 
      newStatusId: string; 
      newPosition: number;
    }) => {
      const { data, error } = await supabase
        .from('flow_tasks')
        .update({
          status_id: newStatusId,
          position: newPosition,
          updated_at: new Date().toISOString(),
        })
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['flow-tasks', data.project_id] });
    },
    onError: (error: Error) => {
      toast.error("Erro ao mover tarefa", { description: error.message });
    },
  });

  // Completar tarefa
  const completeMutation = useMutation({
    mutationFn: async ({ taskId, completed }: { taskId: string; completed: boolean }) => {
      const { data, error } = await supabase
        .from('flow_tasks')
        .update({
          completed_at: completed ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['flow-tasks', data.project_id] });
      queryClient.invalidateQueries({ queryKey: ['flow-task', data.id] });
      toast.success(data.completed_at ? "Tarefa concluída!" : "Tarefa reaberta");
    },
    onError: (error: Error) => {
      toast.error("Erro ao atualizar tarefa", { description: error.message });
    },
  });

  // Deletar tarefa
  const deleteMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from('flow_tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flow-tasks', projectId] });
      toast.success("Tarefa excluída");
    },
    onError: (error: Error) => {
      toast.error("Erro ao excluir tarefa", { description: error.message });
    },
  });

  return {
    tasks: tasksQuery.data || [],
    isLoading: tasksQuery.isLoading,
    error: tasksQuery.error,
    useTask,
    createTask: createMutation.mutate,
    updateTask: updateMutation.mutate,
    moveTask: moveMutation.mutate,
    completeTask: completeMutation.mutate,
    deleteTask: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isMoving: moveMutation.isPending,
  };
}
