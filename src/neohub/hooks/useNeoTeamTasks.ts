import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done' | 'blocked';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date?: string;
  due_time?: string;
  assignee_id?: string;
  assignee_name?: string;
  branch?: string;
  category?: string;
  tags?: string[];
  order_index: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface NewTask {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string;
  due_time?: string;
  assignee_name?: string;
  branch?: string;
  category?: string;
  tags?: string[];
}

export function useNeoTeamTasks(branch?: string) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useUnifiedAuth();

  const fetchTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      let query = supabase
        .from('neoteam_tasks')
        .select('*')
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: false });

      if (branch) {
        query = query.eq('branch', branch);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTasks((data as Task[]) || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as tarefas',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [branch, toast]);

  const createTask = async (task: NewTask) => {
    try {
      const maxOrder = tasks.reduce((max, t) => Math.max(max, t.order_index), 0);
      
      const { data, error } = await supabase
        .from('neoteam_tasks')
        .insert([{
          ...task,
          order_index: maxOrder + 1,
          created_by: user?.id,
        }])
        .select()
        .single();

      if (error) throw error;

      toast({ title: 'Sucesso', description: 'Tarefa criada' });
      await fetchTasks();
      return data as Task;
    } catch (error: any) {
      console.error('Error creating task:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar a tarefa',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    try {
      // If completing task, set completed_at
      if (updates.status === 'done') {
        updates.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('neoteam_tasks')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a tarefa',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const deleteTask = async (id: string) => {
    try {
      const { error } = await supabase
        .from('neoteam_tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({ title: 'Sucesso', description: 'Tarefa removida' });
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível remover a tarefa',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const moveTask = async (id: string, newStatus: TaskStatus) => {
    await updateTask(id, { status: newStatus });
  };

  const reorderTasks = async (reorderedTasks: Task[]) => {
    try {
      const updates = reorderedTasks.map((task, index) => ({
        id: task.id,
        order_index: index,
      }));

      for (const update of updates) {
        await supabase
          .from('neoteam_tasks')
          .update({ order_index: update.order_index })
          .eq('id', update.id);
      }

      setTasks(reorderedTasks);
    } catch (error) {
      console.error('Error reordering tasks:', error);
    }
  };

  // Real-time subscription
  useEffect(() => {
    fetchTasks();

    const channel = supabase
      .channel('neoteam_tasks_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'neoteam_tasks' },
        () => fetchTasks()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTasks]);

  return {
    tasks,
    isLoading,
    createTask,
    updateTask,
    deleteTask,
    moveTask,
    reorderTasks,
    refetch: fetchTasks,
  };
}
