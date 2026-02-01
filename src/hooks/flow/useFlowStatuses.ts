/**
 * useFlowStatuses - Hook para gerenciamento de status de projetos
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FlowProjectStatus } from "@/types/flow";

export function useFlowStatuses(projectId?: string) {
  const queryClient = useQueryClient();

  // Buscar status do projeto
  const statusesQuery = useQuery({
    queryKey: ['flow-statuses', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from('flow_project_statuses')
        .select('*')
        .eq('project_id', projectId)
        .order('position', { ascending: true });

      if (error) throw error;
      return data as FlowProjectStatus[];
    },
    enabled: !!projectId,
  });

  // Criar status
  const createMutation = useMutation({
    mutationFn: async (form: { name: string; color: string; icon?: string }) => {
      if (!projectId) throw new Error("Projeto não definido");

      // Pegar maior position
      const { data: maxPos } = await supabase
        .from('flow_project_statuses')
        .select('position')
        .eq('project_id', projectId)
        .order('position', { ascending: false })
        .limit(1)
        .single();

      const newPosition = (maxPos?.position || 0) + 1;

      const { data, error } = await supabase
        .from('flow_project_statuses')
        .insert({
          project_id: projectId,
          name: form.name,
          color: form.color,
          icon: form.icon || 'circle',
          position: newPosition,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flow-statuses', projectId] });
      toast.success("Status criado!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao criar status", { description: error.message });
    },
  });

  // Atualizar status
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FlowProjectStatus> & { id: string }) => {
      const { data, error } = await supabase
        .from('flow_project_statuses')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flow-statuses', projectId] });
    },
    onError: (error: Error) => {
      toast.error("Erro ao atualizar status", { description: error.message });
    },
  });

  // Reordenar status
  const reorderMutation = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const updates = orderedIds.map((id, index) => ({
        id,
        position: index,
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('flow_project_statuses')
          .update({ position: update.position })
          .eq('id', update.id);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flow-statuses', projectId] });
    },
    onError: (error: Error) => {
      toast.error("Erro ao reordenar status", { description: error.message });
    },
  });

  // Deletar status
  const deleteMutation = useMutation({
    mutationFn: async (statusId: string) => {
      const { error } = await supabase
        .from('flow_project_statuses')
        .delete()
        .eq('id', statusId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flow-statuses', projectId] });
      toast.success("Status excluído");
    },
    onError: (error: Error) => {
      toast.error("Erro ao excluir status", { description: error.message });
    },
  });

  return {
    statuses: statusesQuery.data || [],
    isLoading: statusesQuery.isLoading,
    createStatus: createMutation.mutate,
    updateStatus: updateMutation.mutate,
    reorderStatuses: reorderMutation.mutate,
    deleteStatus: deleteMutation.mutate,
  };
}
