import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth } from 'date-fns';

export interface AgendaAvailability {
  id: string;
  branch: string;
  date: string;
  max_slots: number;
  is_blocked: boolean;
  blocked_reason: string | null;
}

export interface DayAvailability {
  date: string;
  maxSlots: number;
  isBlocked: boolean;
  blockedReason: string | null;
  scheduledCount: number;
  remainingSlots: number;
  status: 'available' | 'full' | 'blocked' | 'not_configured';
}

export function useSurgeryAgendaAvailability(branch: string, month: Date) {
  const queryClient = useQueryClient();
  const monthStart = format(startOfMonth(month), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(month), 'yyyy-MM-dd');

  // Fetch availability config for the branch+month
  const { data: availabilityConfig = [], isLoading: isLoadingConfig } = useQuery({
    queryKey: ['surgery-agenda-availability', branch, monthStart],
    queryFn: async () => {
      if (!branch) return [];
      const { data, error } = await supabase
        .from('surgery_agenda_availability')
        .select('*')
        .eq('branch', branch)
        .gte('date', monthStart)
        .lte('date', monthEnd);
      if (error) throw error;
      return (data || []) as AgendaAvailability[];
    },
    enabled: !!branch,
  });

  // Fetch scheduled surgeries count per day for the branch+month
  const { data: surgeryCounts = {}, isLoading: isLoadingCounts } = useQuery({
    queryKey: ['surgery-day-counts', branch, monthStart],
    queryFn: async () => {
      if (!branch) return {};
      const { data, error } = await supabase
        .from('clinic_surgeries')
        .select('surgery_date')
        .eq('branch', branch)
        .neq('schedule_status', 'sem_data')
        .neq('schedule_status', 'cancelado')
        .gte('surgery_date', monthStart)
        .lte('surgery_date', monthEnd);
      if (error) throw error;
      const counts: Record<string, number> = {};
      (data || []).forEach((s: any) => {
        if (s.surgery_date) {
          counts[s.surgery_date] = (counts[s.surgery_date] || 0) + 1;
        }
      });
      return counts;
    },
    enabled: !!branch,
  });

  // Build day availability map
  const dayAvailabilityMap: Record<string, DayAvailability> = {};
  availabilityConfig.forEach((cfg) => {
    const scheduled = surgeryCounts[cfg.date] || 0;
    const remaining = cfg.is_blocked ? 0 : Math.max(0, cfg.max_slots - scheduled);
    let status: DayAvailability['status'] = 'available';
    if (cfg.is_blocked) status = 'blocked';
    else if (remaining <= 0) status = 'full';

    dayAvailabilityMap[cfg.date] = {
      date: cfg.date,
      maxSlots: cfg.max_slots,
      isBlocked: cfg.is_blocked,
      blockedReason: cfg.blocked_reason,
      scheduledCount: scheduled,
      remainingSlots: remaining,
      status,
    };
  });

  const getDayAvailability = (date: string): DayAvailability => {
    if (dayAvailabilityMap[date]) return dayAvailabilityMap[date];
    const scheduled = surgeryCounts[date] || 0;
    return {
      date,
      maxSlots: 0,
      isBlocked: false,
      blockedReason: null,
      scheduledCount: scheduled,
      remainingSlots: 0,
      status: 'not_configured',
    };
  };

  // Upsert availability config
  const upsertAvailability = useMutation({
    mutationFn: async (input: { branch: string; date: string; max_slots: number; is_blocked: boolean; blocked_reason?: string }) => {
      const { data, error } = await supabase
        .from('surgery_agenda_availability')
        .upsert(
          {
            branch: input.branch,
            date: input.date,
            max_slots: input.max_slots,
            is_blocked: input.is_blocked,
            blocked_reason: input.blocked_reason || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'branch,date' }
        )
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surgery-agenda-availability'] });
      toast.success('Configuração salva!');
    },
    onError: () => {
      toast.error('Erro ao salvar configuração');
    },
  });

  const deleteAvailability = useMutation({
    mutationFn: async ({ branch, date }: { branch: string; date: string }) => {
      const { error } = await supabase
        .from('surgery_agenda_availability')
        .delete()
        .eq('branch', branch)
        .eq('date', date);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surgery-agenda-availability'] });
      toast.success('Configuração removida');
    },
    onError: () => {
      toast.error('Erro ao remover configuração');
    },
  });

  return {
    availabilityConfig,
    dayAvailabilityMap,
    getDayAvailability,
    surgeryCounts,
    isLoading: isLoadingConfig || isLoadingCounts,
    upsertAvailability,
    deleteAvailability,
  };
}
