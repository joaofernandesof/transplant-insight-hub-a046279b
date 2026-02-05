import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { toast } from 'sonner';
import { 
  CleaningChecklist, 
  CleaningChecklistItem, 
  CreateChecklistItemForm 
} from '../types';

export function useCleaningChecklists(environmentId?: string) {
  const queryClient = useQueryClient();
  const { user } = useUnifiedAuth();

  // Buscar checklist ativo do ambiente
  const { data: checklist, isLoading } = useQuery({
    queryKey: ['cleaning-checklist', environmentId],
    queryFn: async () => {
      if (!environmentId) return null;

      const { data, error } = await supabase
        .from('cleaning_checklists')
        .select(`
          *,
          items:cleaning_checklist_items(*)
        `)
        .eq('environment_id', environmentId)
        .eq('is_active', true)
        .order('version', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        // Ordenar itens por order_index
        data.items = (data.items || []).sort((a: CleaningChecklistItem, b: CleaningChecklistItem) => 
          a.order_index - b.order_index
        );
      }

      return data as CleaningChecklist | null;
    },
    enabled: !!environmentId,
  });

  // Adicionar item ao checklist
  const addItem = useMutation({
    mutationFn: async ({ 
      checklistId, 
      item 
    }: { 
      checklistId: string; 
      item: CreateChecklistItemForm;
    }) => {
      // Buscar maior order_index
      const { data: maxOrder } = await supabase
        .from('cleaning_checklist_items')
        .select('order_index')
        .eq('checklist_id', checklistId)
        .order('order_index', { ascending: false })
        .limit(1)
        .single();

      const nextOrder = (maxOrder?.order_index || 0) + 1;

      const { error } = await supabase
        .from('cleaning_checklist_items')
        .insert({
          checklist_id: checklistId,
          ...item,
          order_index: nextOrder,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cleaning-checklist', environmentId] });
      toast.success('Item adicionado!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao adicionar item: ${error.message}`);
    },
  });

  // Atualizar item
  const updateItem = useMutation({
    mutationFn: async ({ 
      id, 
      ...updates 
    }: Partial<CleaningChecklistItem> & { id: string }) => {
      const { error } = await supabase
        .from('cleaning_checklist_items')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cleaning-checklist', environmentId] });
      toast.success('Item atualizado!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar: ${error.message}`);
    },
  });

  // Remover item
  const removeItem = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('cleaning_checklist_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cleaning-checklist', environmentId] });
      toast.success('Item removido!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao remover: ${error.message}`);
    },
  });

  // Reordenar itens
  const reorderItems = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const updates = orderedIds.map((id, index) => ({
        id,
        order_index: index + 1,
      }));

      for (const { id, order_index } of updates) {
        const { error } = await supabase
          .from('cleaning_checklist_items')
          .update({ order_index })
          .eq('id', id);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cleaning-checklist', environmentId] });
    },
  });

  // Criar nova versão do checklist
  const createNewVersion = useMutation({
    mutationFn: async (notes?: string) => {
      if (!environmentId || !checklist) return;

      // Desativar versão atual
      await supabase
        .from('cleaning_checklists')
        .update({ is_active: false })
        .eq('id', checklist.id);

      // Criar nova versão
      const { data: newChecklist, error } = await supabase
        .from('cleaning_checklists')
        .insert({
          environment_id: environmentId,
          version: checklist.version + 1,
          version_notes: notes,
          is_active: true,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Copiar itens da versão anterior
      if (checklist.items && checklist.items.length > 0) {
        const newItems = checklist.items.map(item => ({
          checklist_id: newChecklist.id,
          description: item.description,
          category: item.category,
          order_index: item.order_index,
          is_critical: item.is_critical,
        }));

        const { error: itemsError } = await supabase
          .from('cleaning_checklist_items')
          .insert(newItems);

        if (itemsError) throw itemsError;
      }

      return newChecklist;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cleaning-checklist', environmentId] });
      toast.success('Nova versão criada!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar versão: ${error.message}`);
    },
  });

  return {
    checklist,
    items: checklist?.items || [],
    isLoading,
    addItem,
    updateItem,
    removeItem,
    reorderItems,
    createNewVersion,
  };
}
