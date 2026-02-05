import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { toast } from 'sonner';
import { CleaningSupply, CleaningSupplyMovement, SupplyCategory } from '../types';

export function useCleaningSupplies(branchId?: string) {
  const queryClient = useQueryClient();
  const { user } = useUnifiedAuth();

  // Buscar todos os insumos da branch
  const { data: supplies = [], isLoading } = useQuery({
    queryKey: ['cleaning-supplies', branchId],
    queryFn: async () => {
      let query = supabase
        .from('cleaning_supplies')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (branchId) {
        query = query.eq('branch_id', branchId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as CleaningSupply[];
    },
    enabled: true,
  });

  // Insumos com estoque baixo
  const lowStockSupplies = supplies.filter(s => s.current_stock <= s.min_stock);

  // Buscar movimentações de um insumo
  const useSupplyMovements = (supplyId?: string) => {
    return useQuery({
      queryKey: ['cleaning-supply-movements', supplyId],
      queryFn: async () => {
        if (!supplyId) return [];

        const { data, error } = await supabase
          .from('cleaning_supply_movements')
          .select('*')
          .eq('supply_id', supplyId)
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;
        return data as CleaningSupplyMovement[];
      },
      enabled: !!supplyId,
    });
  };

  // Criar novo insumo
  const createSupply = useMutation({
    mutationFn: async (form: {
      name: string;
      category: SupplyCategory;
      unit: string;
      min_stock: number;
      cost_unit?: number;
      branch_id: string;
    }) => {
      const { error } = await supabase
        .from('cleaning_supplies')
        .insert({
          name: form.name,
          category: form.category,
          unit: form.unit,
          min_stock: form.min_stock,
          cost_unit: form.cost_unit,
          branch_id: form.branch_id,
          current_stock: 0,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cleaning-supplies'] });
      toast.success('Insumo criado!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar insumo: ${error.message}`);
    },
  });

  // Atualizar insumo
  const updateSupply = useMutation({
    mutationFn: async ({ 
      id, 
      ...updates 
    }: Partial<CleaningSupply> & { id: string }) => {
      const { error } = await supabase
        .from('cleaning_supplies')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cleaning-supplies'] });
      toast.success('Insumo atualizado!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar: ${error.message}`);
    },
  });

  // Registrar movimentação
  const registerMovement = useMutation({
    mutationFn: async (form: {
      supply_id: string;
      movement_type: 'entrada' | 'saida' | 'ajuste';
      quantity: number;
      notes?: string;
      execution_id?: string;
    }) => {
      const { error } = await supabase
        .from('cleaning_supply_movements')
        .insert({
          ...form,
          created_by: user?.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cleaning-supplies'] });
      queryClient.invalidateQueries({ queryKey: ['cleaning-supply-movements'] });
      toast.success('Movimentação registrada!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao registrar: ${error.message}`);
    },
  });

  // Desativar insumo
  const deactivateSupply = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('cleaning_supplies')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cleaning-supplies'] });
      toast.success('Insumo desativado!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao desativar: ${error.message}`);
    },
  });

  return {
    supplies,
    lowStockSupplies,
    isLoading,
    useSupplyMovements,
    createSupply,
    updateSupply,
    registerMovement,
    deactivateSupply,
  };
}
