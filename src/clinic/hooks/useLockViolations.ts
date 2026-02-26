import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ClinicSurgery } from './useClinicSurgeries';

interface LockRow {
  branch: string;
  doctor: string;
  permitido: boolean;
  week_start: string;
  week_end: string;
}

/**
 * Checks which surgeries violate schedule_week_locks (blocked category on that week/branch).
 * Returns a Set of surgery IDs that are in violation.
 */
export function useLockViolations(surgeries: ClinicSurgery[]) {
  const { data: locks = [] } = useQuery({
    queryKey: ['schedule-week-locks-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schedule_week_locks')
        .select('branch, doctor, permitido, week_start, week_end')
        .eq('agenda', 'Agenda Cirúrgica')
        .eq('permitido', false);

      if (error) {
        console.error('Error fetching locks:', error);
        return [];
      }
      return (data || []) as LockRow[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const violatedIds = useMemo(() => {
    const violations = new Set<string>();
    if (locks.length === 0) return violations;

    for (const surgery of surgeries) {
      if (!surgery.surgeryDate || !surgery.category || !surgery.branch) continue;

      const normalizedBranch = surgery.branch.replace(/^Filial\s+/i, '');
      const cat = surgery.category.toUpperCase();

      for (const lock of locks) {
        // Check date range
        if (surgery.surgeryDate < lock.week_start || surgery.surgeryDate > lock.week_end) continue;
        // Check branch
        if (lock.branch !== normalizedBranch) continue;

        // Match category to lock doctor
        let matches = false;
        if (cat.includes('CATEGORIA A') && cat.includes('HYGOR') && lock.doctor === 'Categoria A - Hygor') {
          matches = true;
        } else if (cat.includes('CATEGORIA A') && cat.includes('PATRICK') && lock.doctor === 'Categoria A - Patrick') {
          matches = true;
        } else if (cat.includes('CATEGORIA B') && lock.doctor === 'Categoria B') {
          matches = true;
        } else if (cat.includes('CATEGORIA C') && lock.doctor === 'Categoria C') {
          matches = true;
        } else if (cat.includes('CATEGORIA D') && lock.doctor === 'Categoria D') {
          matches = true;
        }

        if (matches) {
          violations.add(surgery.id);
          break;
        }
      }
    }

    return violations;
  }, [surgeries, locks]);

  return { violatedIds, locksLoaded: locks.length > 0 || true };
}
