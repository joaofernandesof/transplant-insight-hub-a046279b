import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ScheduleWeekLock {
  id: string;
  week_number: number;
  week_start: string;
  week_end: string;
  month: string;
  branch: string;
  doctor: string;
  permitido: boolean;
  created_at: string;
  updated_at: string;
}

export const BRANCHES = ['Fortaleza', 'Juazeiro', 'São Paulo'] as const;
export const DOCTORS = ['Hygor', 'Patrick', 'Márcia'] as const;

export function useScheduleWeekLocks() {
  const queryClient = useQueryClient();

  const { data: locks = [], isLoading } = useQuery({
    queryKey: ['schedule-week-locks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schedule_week_locks')
        .select('*')
        .order('week_number')
        .order('branch')
        .order('doctor');

      if (error) throw error;
      return data as ScheduleWeekLock[];
    },
  });

  const updateLock = useMutation({
    mutationFn: async ({ id, permitido }: { id: string; permitido: boolean }) => {
      const { error } = await supabase
        .from('schedule_week_locks')
        .update({ permitido })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule-week-locks'] });
      toast.success('Trava atualizada!');
    },
    onError: () => toast.error('Erro ao atualizar trava'),
  });

  const bulkUpdateLocks = useMutation({
    mutationFn: async ({ ids, permitido }: { ids: string[]; permitido: boolean }) => {
      const { error } = await supabase
        .from('schedule_week_locks')
        .update({ permitido })
        .in('id', ids);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['schedule-week-locks'] });
      toast.success(variables.permitido ? 'Todas as semanas desbloqueadas!' : 'Todas as semanas bloqueadas!');
    },
    onError: () => toast.error('Erro ao atualizar travas em massa'),
  });

  // Get unique week numbers with their dates
  const weeks = locks.reduce<Array<{ week_number: number; week_start: string; week_end: string; month: string }>>((acc, lock) => {
    if (!acc.find(w => w.week_number === lock.week_number)) {
      acc.push({
        week_number: lock.week_number,
        week_start: lock.week_start,
        week_end: lock.week_end,
        month: lock.month,
      });
    }
    return acc;
  }, []);

  return { locks, weeks, isLoading, updateLock, bulkUpdateLocks };
}

export function useValidateWeekLock() {
  const validate = async (params: {
    date: string;
    branch: string;
    doctor: string;
  }): Promise<{ permitido: boolean; week_number: number; mensagem: string }> => {
    const { data, error } = await supabase.rpc('validate_schedule_week_lock', {
      p_date: params.date,
      p_branch: params.branch,
      p_doctor: params.doctor,
    });

    if (error) {
      console.error('Week lock validation error:', error);
      return { permitido: true, week_number: 0, mensagem: 'Erro na validação' };
    }

    const result = data as unknown as { permitido: boolean; week_number: number; mensagem: string };
    return result;
  };

  return { validate };
}
