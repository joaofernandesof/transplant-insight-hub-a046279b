import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface CrmTask {
  id: string;
  lead_id: string;
  title: string;
  description: string | null;
  due_at: string | null;
  completed_at: string | null;
  priority: 'low' | 'medium' | 'high';
  assigned_to: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTaskData {
  lead_id: string;
  title: string;
  description?: string;
  due_at?: string;
  priority?: 'low' | 'medium' | 'high';
  assigned_to?: string;
}

export function useCrmTasks(leadId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['crm-tasks', leadId],
    queryFn: async () => {
      let query = supabase
        .from('lead_tasks')
        .select('*')
        .order('due_at', { ascending: true, nullsFirst: false });
      
      if (leadId) {
        query = query.eq('lead_id', leadId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as CrmTask[];
    },
  });

  const createTask = useMutation({
    mutationFn: async (data: CreateTaskData) => {
      const { data: newTask, error } = await supabase
        .from('lead_tasks')
        .insert({
          ...data,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return newTask as CrmTask;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-tasks'] });
      toast.success('Tarefa criada. A gente te lembra.');
    },
    onError: () => {
      toast.error('Erro ao criar tarefa');
    },
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, ...data }: Partial<CrmTask> & { id: string }) => {
      const { error } = await supabase
        .from('lead_tasks')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-tasks'] });
    },
    onError: () => {
      toast.error('Erro ao atualizar tarefa');
    },
  });

  const completeTask = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from('lead_tasks')
        .update({ completed_at: new Date().toISOString() })
        .eq('id', taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-tasks'] });
      toast.success('Tarefa concluída!');
    },
    onError: () => {
      toast.error('Erro ao concluir tarefa');
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from('lead_tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-tasks'] });
      toast.success('Tarefa removida');
    },
    onError: () => {
      toast.error('Erro ao remover tarefa');
    },
  });

  // Get pending tasks (not completed)
  const pendingTasks = tasks.filter(t => !t.completed_at);
  const overdueTasks = pendingTasks.filter(t => t.due_at && new Date(t.due_at) < new Date());

  return {
    tasks,
    pendingTasks,
    overdueTasks,
    isLoading,
    createTask,
    updateTask,
    completeTask,
    deleteTask,
  };
}
