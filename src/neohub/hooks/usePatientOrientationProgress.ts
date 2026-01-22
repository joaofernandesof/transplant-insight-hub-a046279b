import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNeoHubAuth } from '@/neohub/contexts/NeoHubAuthContext';
import { toast } from 'sonner';
import { useEffect } from 'react';

interface OrientationProgress {
  id: string;
  patient_id: string;
  task_id: string;
  task_type: 'pre' | 'post';
  task_day: number;
  completed_at: string | null;
  is_overdue: boolean;
  overdue_at: string | null;
}

export function usePatientOrientationProgress() {
  const { user, isLoading: authLoading } = useNeoHubAuth();
  const queryClient = useQueryClient();

  // Fetch all progress records for current patient
  const { data: progress, isLoading, error } = useQuery({
    queryKey: ['patient-orientation-progress', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('patient_orientation_progress')
        .select('*')
        .eq('patient_id', user.id);

      if (error) {
        console.error('Error fetching orientation progress:', error);
        throw error;
      }

      return (data || []) as OrientationProgress[];
    },
    enabled: !!user?.id && !authLoading,
  });

  // Migrate localStorage data to database on first load
  useEffect(() => {
    if (!user?.id || authLoading || isLoading) return;

    const migrateLocalStorage = async () => {
      // Check if migration already done
      const migrated = localStorage.getItem('neocare_progress_migrated');
      if (migrated === user.id) return;

      // Get localStorage data
      const preChecked = JSON.parse(localStorage.getItem('neocare_pre_checklist') || '{}');
      const postChecked = JSON.parse(localStorage.getItem('neocare_post_checklist_v2') || '{}');

      const records: { task_id: string; task_type: 'pre' | 'post'; task_day: number; completed_at: string | null }[] = [];

      // Pre-transplant tasks
      const preTasks: Record<string, number> = {
        'sync_calendar': 15, 'exames': 7, 'consulta': 3, 'minoxidil': 7,
        'aspirina': 7, 'vitaminas': 7, 'alcool': 5, 'cigarro': 7, 'cabelo': 0
      };
      
      for (const [taskId, checked] of Object.entries(preChecked)) {
        if (checked) {
          records.push({
            task_id: taskId,
            task_type: 'pre',
            task_day: -(preTasks[taskId] || 0),
            completed_at: new Date().toISOString()
          });
        }
      }

      // Post-transplant tasks
      const postDays: Record<string, number> = {
        'd1_soro': 1, 'd1_dormir': 1, 'd1_gelo': 1,
        'd2_soro': 2, 'd2_medicacao': 2, 'd2_repouso': 2,
        'd3_lavar': 3, 'd3_doadora': 3, 'd3_secar': 3,
        'd5_lavagem': 5, 'd5_espuma': 5, 'd5_cafe': 5,
        'd8_circular': 8, 'd8_lado': 8, 'd8_camisa': 8,
        'd10_oleo': 10, 'd10_academia': 10, 'd10_crostas': 10,
        'd15_chuveiro': 15, 'd15_shampoo': 15, 'd15_massagem': 15
      };

      for (const [taskId, data] of Object.entries(postChecked)) {
        const taskData = data as { done?: boolean; doneAt?: string };
        if (taskData?.done) {
          records.push({
            task_id: taskId,
            task_type: 'post',
            task_day: postDays[taskId] || 0,
            completed_at: taskData.doneAt || new Date().toISOString()
          });
        }
      }

      // Insert records
      if (records.length > 0) {
        for (const record of records) {
          await supabase.from('patient_orientation_progress').upsert({
            patient_id: user.id,
            ...record
          }, { onConflict: 'patient_id,task_id' });
        }
      }

      // Mark as migrated
      localStorage.setItem('neocare_progress_migrated', user.id);
    };

    migrateLocalStorage();
  }, [user?.id, authLoading, isLoading]);

  // Toggle task completion
  const toggleTask = useMutation({
    mutationFn: async ({ taskId, taskType, taskDay }: { taskId: string; taskType: 'pre' | 'post'; taskDay: number }) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Check if task exists
      const { data: existing } = await supabase
        .from('patient_orientation_progress')
        .select('id, completed_at')
        .eq('patient_id', user.id)
        .eq('task_id', taskId)
        .single();

      if (existing) {
        // Toggle completion
        const isCompleted = !!existing.completed_at;
        const { error } = await supabase
          .from('patient_orientation_progress')
          .update({ 
            completed_at: isCompleted ? null : new Date().toISOString(),
            is_overdue: isCompleted ? true : false
          })
          .eq('id', existing.id);
        
        if (error) throw error;
        return !isCompleted;
      } else {
        // Create new completed record
        const { error } = await supabase
          .from('patient_orientation_progress')
          .insert({
            patient_id: user.id,
            task_id: taskId,
            task_type: taskType,
            task_day: taskDay,
            completed_at: new Date().toISOString(),
            is_overdue: false
          });
        
        if (error) throw error;
        return true;
      }
    },
    onSuccess: (completed) => {
      queryClient.invalidateQueries({ queryKey: ['patient-orientation-progress'] });
      if (completed) {
        toast.success('Tarefa concluída! 🎉');
      }
    },
    onError: (error) => {
      console.error('Error toggling task:', error);
      toast.error('Erro ao atualizar tarefa');
    },
  });

  // Get completion status for a task
  const isTaskCompleted = (taskId: string): boolean => {
    if (!progress) return false;
    const task = progress.find(p => p.task_id === taskId);
    return !!task?.completed_at;
  };

  // Get completion timestamp
  const getCompletedAt = (taskId: string): string | null => {
    if (!progress) return null;
    const task = progress.find(p => p.task_id === taskId);
    return task?.completed_at || null;
  };

  // Check if task is marked overdue
  const isTaskMarkedOverdue = (taskId: string): boolean => {
    if (!progress) return false;
    const task = progress.find(p => p.task_id === taskId);
    return task?.is_overdue || false;
  };

  return {
    progress,
    isLoading: isLoading || authLoading,
    error,
    toggleTask: toggleTask.mutate,
    isToggling: toggleTask.isPending,
    isTaskCompleted,
    getCompletedAt,
    isTaskMarkedOverdue,
  };
}
