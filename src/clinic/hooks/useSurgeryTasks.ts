import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SurgeryTask {
  id: string;
  surgery_id: string;
  definition_id: string | null;
  d_offset: number | null;
  title: string;
  scheduled_date: string | null;
  responsible_name: string;
  responsible_email: string;
  is_required: boolean;
  status: 'pending' | 'active' | 'completed' | 'overdue';
  phase_label: string;
  phase_color: string;
  completed_at: string | null;
  completed_by: string | null;
  observation: string | null;
  has_problem: boolean;
  created_at: string;
  updated_at: string;
}

export interface TaskPhaseGroup {
  label: string;
  color: string;
  d_offset: number | null;
  tasks: SurgeryTask[];
  totalCount: number;
  completedCount: number;
  hasOverdue: boolean;
  hasProblem: boolean;
}

export function useSurgeryTasks(surgeryId?: string) {
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['surgery-tasks', surgeryId],
    queryFn: async () => {
      if (!surgeryId) return [];
      const { data, error } = await supabase
        .from('surgery_tasks')
        .select('*')
        .eq('surgery_id', surgeryId)
        .order('d_offset', { ascending: true, nullsFirst: true });

      if (error) throw error;
      return (data || []) as SurgeryTask[];
    },
    enabled: !!surgeryId,
  });

  // Group tasks by phase
  const phases: TaskPhaseGroup[] = (() => {
    const phaseMap = new Map<string, TaskPhaseGroup>();
    for (const task of tasks) {
      const key = task.phase_label;
      if (!phaseMap.has(key)) {
        phaseMap.set(key, {
          label: key,
          color: task.phase_color,
          d_offset: task.d_offset,
          tasks: [],
          totalCount: 0,
          completedCount: 0,
          hasOverdue: false,
          hasProblem: false,
        });
      }
      const phase = phaseMap.get(key)!;
      phase.tasks.push(task);
      phase.totalCount++;
      if (task.status === 'completed') phase.completedCount++;
      if (task.status === 'overdue') phase.hasOverdue = true;
      if (task.has_problem) phase.hasProblem = true;
    }
    return Array.from(phaseMap.values());
  })();

  const completeTask = useMutation({
    mutationFn: async ({ taskId, observation }: { taskId: string; observation?: string }) => {
      const { error } = await supabase
        .from('surgery_tasks')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          completed_by: (await supabase.auth.getUser()).data.user?.id,
          observation: observation || null,
        })
        .eq('id', taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surgery-tasks', surgeryId] });
      queryClient.invalidateQueries({ queryKey: ['surgery-tasks-all'] });
      toast.success('Tarefa concluída!');
    },
    onError: () => toast.error('Erro ao concluir tarefa'),
  });

  const flagProblem = useMutation({
    mutationFn: async ({ taskId, observation }: { taskId: string; observation: string }) => {
      const { error } = await supabase
        .from('surgery_tasks')
        .update({ has_problem: true, observation })
        .eq('id', taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surgery-tasks', surgeryId] });
      queryClient.invalidateQueries({ queryKey: ['surgery-tasks-all'] });
      toast.success('Problema registrado');
    },
    onError: () => toast.error('Erro ao registrar problema'),
  });

  return { tasks, phases, isLoading, completeTask, flagProblem };
}

// Hook for operational dashboard: all tasks across surgeries
export function useAllSurgeryTasks() {
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['surgery-tasks-all'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('surgery_tasks')
        .select('*, surgery_schedule!inner(patient_name, surgery_date)')
        .or(`status.eq.active,status.eq.overdue,and(status.eq.pending,scheduled_date.eq.${today})`)
        .order('scheduled_date', { ascending: true });

      if (error) throw error;
      return (data || []).map((t: any) => ({
        ...t,
        patient_name: t.surgery_schedule?.patient_name,
        surgery_date: t.surgery_schedule?.surgery_date,
      }));
    },
  });

  const todayTasks = tasks.filter((t: any) => t.scheduled_date === new Date().toISOString().split('T')[0]);
  const overdueTasks = tasks.filter((t: any) => t.status === 'overdue');

  // Group by responsible
  const byResponsible = new Map<string, typeof tasks>();
  for (const t of tasks) {
    const key = t.responsible_name;
    if (!byResponsible.has(key)) byResponsible.set(key, []);
    byResponsible.get(key)!.push(t);
  }

  const completeTask = async (taskId: string) => {
    const { error } = await supabase
      .from('surgery_tasks')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        completed_by: (await supabase.auth.getUser()).data.user?.id,
      })
      .eq('id', taskId);
    if (error) {
      toast.error('Erro ao concluir tarefa');
    } else {
      queryClient.invalidateQueries({ queryKey: ['surgery-tasks-all'] });
      toast.success('Tarefa concluída!');
    }
  };

  return { tasks, todayTasks, overdueTasks, byResponsible, isLoading, completeTask };
}
