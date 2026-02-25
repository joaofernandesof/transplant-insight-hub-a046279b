import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export interface LockAvailability {
  doctor: string;
  permitido: boolean;
}

/**
 * Fetches lock availability for a given date + branch for the surgical agenda.
 * Returns which categories/doctors are blocked or allowed for that week.
 */
export function useWeekLockAvailability(date: Date | undefined, branch: string) {
  const [locks, setLocks] = useState<LockAvailability[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Normalize branch name: "Filial Fortaleza" -> "Fortaleza", "Filial Juazeiro" -> "Juazeiro"
  const normalizeBranch = (b: string): string => {
    return b.replace(/^Filial\s+/i, '');
  };

  useEffect(() => {
    if (!date || !branch) {
      setLocks([]);
      return;
    }

    const dateStr = format(date, 'yyyy-MM-dd');
    const normalizedBranch = normalizeBranch(branch);
    setIsLoading(true);

    supabase
      .from('schedule_week_locks')
      .select('doctor, permitido')
      .eq('branch', normalizedBranch)
      .eq('agenda', 'Agenda Cirúrgica')
      .lte('week_start', dateStr)
      .gte('week_end', dateStr)
      .then(({ data, error }) => {
        if (error) {
          console.error('Error fetching week locks:', error);
          setLocks([]);
        } else {
          setLocks((data || []) as LockAvailability[]);
        }
        setIsLoading(false);
      });
  }, [date, branch]);

  /**
   * Check if a specific lock category is blocked.
   * lockDoctor should match the DB format: "Categoria A - Hygor", "Categoria B", etc.
   */
  const isBlocked = (lockDoctor: string): boolean => {
    const lock = locks.find((l) => l.doctor === lockDoctor);
    if (!lock) return false; // No lock configured = allowed
    return !lock.permitido;
  };

  /**
   * Check if a form category + doctor combo is blocked.
   * Maps form values to the lock naming convention.
   */
  const isCategoryBlocked = (category: string, doctor?: string): boolean => {
    const normalized = category.trim().toLowerCase();

    if (normalized.startsWith('categoria a')) {
      const categoryDoctor = category.split(' - ')[1]?.trim();
      const resolvedDoctor = categoryDoctor || doctor;
      if (!resolvedDoctor) return false;
      return isBlocked(`Categoria A - ${resolvedDoctor}`);
    }

    if (normalized.startsWith('categoria b')) return isBlocked('Categoria B');
    if (normalized.startsWith('categoria c')) return isBlocked('Categoria C');
    if (normalized.startsWith('categoria d')) return isBlocked('Categoria D');

    return false;
  };

  /**
   * Get a summary of blocked categories for display.
   */
  const getBlockedCategories = (): string[] => {
    return locks.filter((l) => !l.permitido).map((l) => l.doctor);
  };

  return { locks, isLoading, isBlocked, isCategoryBlocked, getBlockedCategories };
}
