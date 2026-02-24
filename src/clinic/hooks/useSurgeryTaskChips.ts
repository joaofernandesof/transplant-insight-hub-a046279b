import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface TaskChipData {
  surgery_id: string;
  phase_label: string;
  status: string;
  has_problem: boolean;
}

/**
 * Lightweight hook that fetches only the fields needed for chip rendering
 * across all surgeries (batch), avoiding N+1 queries.
 */
export function useSurgeryTaskChips(surgeryIds: string[]) {
  const { data: tasksBySurgery = new Map<string, TaskChipData[]>(), isLoading } = useQuery({
    queryKey: ['surgery-task-chips', surgeryIds.sort().join(',')],
    queryFn: async () => {
      if (surgeryIds.length === 0) return new Map<string, TaskChipData[]>();

      const { data, error } = await supabase
        .from('surgery_tasks')
        .select('surgery_id, phase_label, status, has_problem')
        .in('surgery_id', surgeryIds);

      if (error) throw error;

      const map = new Map<string, TaskChipData[]>();
      for (const row of data || []) {
        if (!map.has(row.surgery_id)) map.set(row.surgery_id, []);
        map.get(row.surgery_id)!.push(row as TaskChipData);
      }
      return map;
    },
    enabled: surgeryIds.length > 0,
    staleTime: 30_000,
  });

  return { tasksBySurgery, isLoading };
}
