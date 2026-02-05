import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CleaningEnvironmentExecutionWithDetails, CleaningAuditLog } from '../types';

export function useCleaningInspection(branchId?: string, date?: string) {
  const routineDate = date || new Date().toISOString().split('T')[0];

  // Buscar execuções aguardando fiscalização
  const { data: pendingInspections = [], isLoading: isLoadingPending } = useQuery({
    queryKey: ['cleaning-pending-inspections', branchId, routineDate],
    queryFn: async () => {
      if (!branchId) return [];

      const { data, error } = await supabase
        .from('cleaning_environment_executions')
        .select(`
          *,
          environment:cleaning_environments(*),
          routine:cleaning_daily_routines!inner(branch_id, routine_date)
        `)
        .eq('status', 'aguardando_fiscalizacao')
        .eq('routine.branch_id', branchId)
        .eq('routine.routine_date', routineDate);

      if (error) throw error;
      return data as CleaningEnvironmentExecutionWithDetails[];
    },
    enabled: !!branchId,
  });

  // Buscar execuções já inspecionadas hoje
  const { data: inspectedToday = [], isLoading: isLoadingInspected } = useQuery({
    queryKey: ['cleaning-inspected-today', branchId, routineDate],
    queryFn: async () => {
      if (!branchId) return [];

      const { data, error } = await supabase
        .from('cleaning_environment_executions')
        .select(`
          *,
          environment:cleaning_environments(*),
          routine:cleaning_daily_routines!inner(branch_id, routine_date)
        `)
        .in('status', ['aprovado', 'reprovado'])
        .eq('routine.branch_id', branchId)
        .eq('routine.routine_date', routineDate)
        .order('approved_at', { ascending: false });

      if (error) throw error;
      return data as CleaningEnvironmentExecutionWithDetails[];
    },
    enabled: !!branchId,
  });

  // Buscar histórico de auditoria
  const useAuditHistory = (limit: number = 50) => {
    return useQuery({
      queryKey: ['cleaning-audit-history', branchId, limit],
      queryFn: async () => {
        let query = supabase
          .from('cleaning_audit_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit);

        const { data, error } = await query;
        if (error) throw error;
        return data as CleaningAuditLog[];
      },
    });
  };

  return {
    pendingInspections,
    inspectedToday,
    isLoading: isLoadingPending || isLoadingInspected,
    useAuditHistory,
  };
}
