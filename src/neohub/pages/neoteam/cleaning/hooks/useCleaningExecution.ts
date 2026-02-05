import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { toast } from 'sonner';
import { CleaningExecutionItem, CleaningChecklistItem } from '../types';

export function useCleaningExecution(executionId?: string) {
  const queryClient = useQueryClient();
  const { user } = useUnifiedAuth();

  // Buscar itens da execução com detalhes do checklist
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['cleaning-execution-items', executionId],
    queryFn: async () => {
      if (!executionId) return [];

      const { data, error } = await supabase
        .from('cleaning_execution_items')
        .select(`
          *,
          checklist_item:cleaning_checklist_items(*)
        `)
        .eq('execution_id', executionId)
        .order('created_at');

      if (error) throw error;
      return data as (CleaningExecutionItem & { checklist_item: CleaningChecklistItem })[];
    },
    enabled: !!executionId,
  });

  // Agrupar itens por categoria
  const itemsByCategory = items.reduce((acc, item) => {
    const category = item.checklist_item?.category || 'limpeza_geral';
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {} as Record<string, typeof items>);

  // Estatísticas de progresso
  const completedCount = items.filter(i => i.is_completed).length;
  const totalCount = items.length;
  const percentComplete = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const allCompleted = completedCount === totalCount && totalCount > 0;

  // Marcar/desmarcar item
  const toggleItem = useMutation({
    mutationFn: async ({ itemId, completed }: { itemId: string; completed: boolean }) => {
      const { error } = await supabase
        .from('cleaning_execution_items')
        .update({
          is_completed: completed,
          completed_at: completed ? new Date().toISOString() : null,
          completed_by: completed ? user?.id : null,
        })
        .eq('id', itemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cleaning-execution-items', executionId] });
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar item: ${error.message}`);
    },
  });

  // Criar itens de execução a partir do checklist
  const createExecutionItems = useMutation({
    mutationFn: async ({ 
      executionId, 
      checklistId 
    }: { 
      executionId: string; 
      checklistId: string;
    }) => {
      // Buscar itens do checklist
      const { data: checklistItems, error: fetchError } = await supabase
        .from('cleaning_checklist_items')
        .select('*')
        .eq('checklist_id', checklistId)
        .order('order_index');

      if (fetchError) throw fetchError;

      // Criar itens de execução
      const executionItems = checklistItems.map(item => ({
        execution_id: executionId,
        checklist_item_id: item.id,
        is_completed: false,
        is_rejected: false,
      }));

      const { error: insertError } = await supabase
        .from('cleaning_execution_items')
        .insert(executionItems);

      if (insertError) throw insertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cleaning-execution-items', executionId] });
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar itens: ${error.message}`);
    },
  });

  // Limpar rejeições (após correção)
  const clearRejections = useMutation({
    mutationFn: async () => {
      if (!executionId) return;

      const { error } = await supabase
        .from('cleaning_execution_items')
        .update({
          is_rejected: false,
          rejection_note: null,
        })
        .eq('execution_id', executionId)
        .eq('is_rejected', true);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cleaning-execution-items', executionId] });
    },
  });

  return {
    items,
    itemsByCategory,
    completedCount,
    totalCount,
    percentComplete,
    allCompleted,
    isLoading,
    toggleItem,
    createExecutionItems,
    clearRejections,
  };
}
