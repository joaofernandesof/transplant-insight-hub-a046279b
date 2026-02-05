import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { toast } from 'sonner';
import { CleaningEnvironment, CleaningEnvironmentWithChecklist, CleaningChecklist, CreateEnvironmentForm } from '../types';

export function useCleaningEnvironments(branchId?: string) {
  const queryClient = useQueryClient();
  const { user } = useUnifiedAuth();

  // Buscar todos os ambientes da branch
  const { data: environments = [], isLoading } = useQuery({
    queryKey: ['cleaning-environments', branchId],
    queryFn: async () => {
      let query = supabase
        .from('cleaning_environments')
        .select('*')
        .eq('is_active', true)
        .order('sanitary_risk_level')
        .order('priority_order');

      if (branchId) {
        query = query.eq('branch_id', branchId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Buscar checklists ativos para cada ambiente
      const environmentsWithChecklists: CleaningEnvironmentWithChecklist[] = [];
      
      for (const env of data || []) {
        const { data: checklists } = await supabase
          .from('cleaning_checklists')
          .select('id, version, is_active')
          .eq('environment_id', env.id)
          .eq('is_active', true)
          .limit(1);

        const activeChecklist = checklists?.[0] || null;
        let itemsCount = 0;

        if (activeChecklist) {
          const { count } = await supabase
            .from('cleaning_checklist_items')
            .select('*', { count: 'exact', head: true })
            .eq('checklist_id', activeChecklist.id);
          itemsCount = count || 0;
        }

        environmentsWithChecklists.push({
          ...env,
          active_checklist: activeChecklist as CleaningChecklist | null,
          items_count: itemsCount,
        });
      }

      return environmentsWithChecklists;
    },
    enabled: true,
  });

  // Criar novo ambiente
  const createEnvironment = useMutation({
    mutationFn: async (form: CreateEnvironmentForm) => {
      const { data, error } = await supabase
        .from('cleaning_environments')
        .insert({
          name: form.name,
          description: form.description,
          environment_type: form.environment_type,
          sanitary_risk_level: form.sanitary_risk_level,
          priority_order: form.priority_order,
          branch_id: form.branch_id,
        })
        .select()
        .single();

      if (error) throw error;

      // Criar checklist padrão vazio
      const { error: checklistError } = await supabase
        .from('cleaning_checklists')
        .insert({
          environment_id: data.id,
          version: 1,
          is_active: true,
          created_by: user?.id,
        });

      if (checklistError) throw checklistError;

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cleaning-environments'] });
      toast.success('Ambiente criado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar ambiente: ${error.message}`);
    },
  });

  // Atualizar ambiente
  const updateEnvironment = useMutation({
    mutationFn: async ({ 
      id, 
      ...updates 
    }: Partial<CleaningEnvironment> & { id: string }) => {
      const { error } = await supabase
        .from('cleaning_environments')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cleaning-environments'] });
      toast.success('Ambiente atualizado!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar: ${error.message}`);
    },
  });

  // Desativar ambiente
  const deactivateEnvironment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('cleaning_environments')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cleaning-environments'] });
      toast.success('Ambiente desativado!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao desativar: ${error.message}`);
    },
  });

  // Reordenar prioridades
  const reorderEnvironments = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const updates = orderedIds.map((id, index) => ({
        id,
        priority_order: index + 1,
      }));

      for (const { id, priority_order } of updates) {
        const { error } = await supabase
          .from('cleaning_environments')
          .update({ priority_order })
          .eq('id', id);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cleaning-environments'] });
      toast.success('Ordem atualizada!');
    },
  });

  return {
    environments,
    isLoading,
    createEnvironment,
    updateEnvironment,
    deactivateEnvironment,
    reorderEnvironments,
  };
}
