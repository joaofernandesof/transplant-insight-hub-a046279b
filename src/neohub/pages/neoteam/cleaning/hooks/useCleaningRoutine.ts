import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { toast } from 'sonner';
import { 
  CleaningDailyRoutine, 
  CleaningEnvironmentExecutionWithDetails,
  CleaningRoutineStats,
  CleaningExecutionStatus
} from '../types';

export function useCleaningRoutine(branchId?: string, date?: string) {
  const queryClient = useQueryClient();
  const { user } = useUnifiedAuth();
  const routineDate = date || new Date().toISOString().split('T')[0];

  // Buscar ou criar rotina do dia
  const { data: routine, isLoading: isLoadingRoutine } = useQuery({
    queryKey: ['cleaning-routine', branchId, routineDate],
    queryFn: async () => {
      if (!branchId) return null;

      // Tentar criar ou buscar rotina
      const { data, error } = await supabase
        .rpc('create_or_get_daily_cleaning_routine', {
          p_branch_id: branchId,
          p_date: routineDate
        });

      if (error) throw error;
      
      // Buscar dados completos da rotina
      const { data: routineData, error: routineError } = await supabase
        .from('cleaning_daily_routines')
        .select('*')
        .eq('id', data)
        .single();

      if (routineError) throw routineError;
      return routineData as CleaningDailyRoutine;
    },
    enabled: !!branchId,
  });

  // Buscar execuções com detalhes
  const { data: executions = [], isLoading: isLoadingExecutions } = useQuery({
    queryKey: ['cleaning-executions', routine?.id],
    queryFn: async () => {
      if (!routine?.id) return [];

      const { data, error } = await supabase
        .from('cleaning_environment_executions')
        .select(`
          *,
          environment:cleaning_environments(*),
          checklist:cleaning_checklists(
            *,
            items:cleaning_checklist_items(*)
          )
        `)
        .eq('routine_id', routine.id)
        .order('created_at');

      if (error) throw error;

      // Ordenar por risco e prioridade
      return (data as CleaningEnvironmentExecutionWithDetails[]).sort((a, b) => {
        const riskOrder: Record<string, number> = { critico: 1, semicritico: 2, nao_critico: 3 };
        const riskA = riskOrder[a.environment?.sanitary_risk_level || 'nao_critico'] || 3;
        const riskB = riskOrder[b.environment?.sanitary_risk_level || 'nao_critico'] || 3;
        
        if (riskA !== riskB) return riskA - riskB;
        return (a.environment?.priority_order || 100) - (b.environment?.priority_order || 100);
      });
    },
    enabled: !!routine?.id,
  });

  // Calcular estatísticas
  const stats: CleaningRoutineStats = {
    total: executions.length,
    pendente: executions.filter(e => e.status === 'pendente').length,
    em_execucao: executions.filter(e => e.status === 'em_execucao').length,
    finalizado_limpeza: executions.filter(e => e.status === 'finalizado_limpeza').length,
    aguardando_fiscalizacao: executions.filter(e => e.status === 'aguardando_fiscalizacao').length,
    reprovado: executions.filter(e => e.status === 'reprovado').length,
    corrigido: executions.filter(e => e.status === 'corrigido').length,
    aprovado: executions.filter(e => e.status === 'aprovado').length,
    percentComplete: executions.length > 0 
      ? Math.round((executions.filter(e => e.status === 'aprovado').length / executions.length) * 100)
      : 0,
  };

  // Próximo ambiente disponível para limpeza
  const nextAvailableExecution = executions.find(e => 
    e.status === 'pendente' || e.status === 'corrigido' || e.status === 'reprovado'
  );

  // Ambiente em execução atual
  const currentExecution = executions.find(e => e.status === 'em_execucao');

  // Iniciar execução de ambiente
  const startExecution = useMutation({
    mutationFn: async (executionId: string) => {
      const { error } = await supabase
        .from('cleaning_environment_executions')
        .update({
          status: 'em_execucao' as CleaningExecutionStatus,
          started_at: new Date().toISOString(),
          executed_by: user?.id,
        })
        .eq('id', executionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cleaning-executions'] });
      toast.success('Limpeza iniciada!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao iniciar: ${error.message}`);
    },
  });

  // Finalizar limpeza de ambiente
  const finishCleaning = useMutation({
    mutationFn: async (executionId: string) => {
      const { error } = await supabase
        .from('cleaning_environment_executions')
        .update({
          status: 'aguardando_fiscalizacao' as CleaningExecutionStatus,
          finished_at: new Date().toISOString(),
        })
        .eq('id', executionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cleaning-executions'] });
      toast.success('Limpeza finalizada! Aguardando fiscalização.');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao finalizar: ${error.message}`);
    },
  });

  // Aprovar ambiente
  const approveExecution = useMutation({
    mutationFn: async (executionId: string) => {
      const { error } = await supabase
        .from('cleaning_environment_executions')
        .update({
          status: 'aprovado' as CleaningExecutionStatus,
          approved_at: new Date().toISOString(),
          approved_by: user?.id,
        })
        .eq('id', executionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cleaning-executions'] });
      queryClient.invalidateQueries({ queryKey: ['cleaning-routine'] });
      toast.success('Ambiente aprovado!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao aprovar: ${error.message}`);
    },
  });

  // Reprovar ambiente
  const rejectExecution = useMutation({
    mutationFn: async ({ 
      executionId, 
      rejectedItems, 
      notes 
    }: { 
      executionId: string; 
      rejectedItems: string[];
      notes: string;
    }) => {
      // Buscar correction_count atual
      const { data: currentExec } = await supabase
        .from('cleaning_environment_executions')
        .select('correction_count')
        .eq('id', executionId)
        .single();

      // Atualizar status da execução
      const { error: execError } = await supabase
        .from('cleaning_environment_executions')
        .update({
          status: 'reprovado' as CleaningExecutionStatus,
          rejection_notes: notes,
          correction_count: (currentExec?.correction_count || 0) + 1,
        })
        .eq('id', executionId);

      if (execError) throw execError;

      // Marcar itens como rejeitados
      for (const itemId of rejectedItems) {
        const { error } = await supabase
          .from('cleaning_execution_items')
          .update({
            is_rejected: true,
            rejection_note: notes,
          })
          .eq('id', itemId);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cleaning-executions'] });
      toast.warning('Ambiente reprovado. Retornado para correção.');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao reprovar: ${error.message}`);
    },
  });

  return {
    routine,
    executions,
    stats,
    nextAvailableExecution,
    currentExecution,
    isLoading: isLoadingRoutine || isLoadingExecutions,
    startExecution,
    finishCleaning,
    approveExecution,
    rejectExecution,
  };
}
