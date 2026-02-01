/**
 * useFlowProjects - Hook para gerenciamento de projetos Flow.do
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FlowProject, CreateProjectForm } from "@/types/flow";
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext";

export function useFlowProjects(tenantId?: string) {
  const queryClient = useQueryClient();
  const { user } = useUnifiedAuth();

  // Buscar projetos do tenant
  const projectsQuery = useQuery({
    queryKey: ['flow-projects', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      
      const { data, error } = await supabase
        .from('flow_projects')
        .select(`
          *,
          creator:neohub_users!flow_projects_creator_id_fkey(id, full_name, email, avatar_url),
          statuses:flow_project_statuses(id, name, color, icon, position, is_done_status)
        `)
        .eq('tenant_id', tenantId)
        .eq('is_archived', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as FlowProject[];
    },
    enabled: !!tenantId,
  });

  // Buscar projeto específico
  const useProject = (projectId?: string) => {
    return useQuery({
      queryKey: ['flow-project', projectId],
      queryFn: async () => {
        if (!projectId) return null;
        
        const { data, error } = await supabase
          .from('flow_projects')
          .select(`
            *,
            creator:neohub_users!flow_projects_creator_id_fkey(id, full_name, email, avatar_url),
            members:flow_project_members(
              user_id,
              role,
              joined_at,
              user:neohub_users(id, full_name, email, avatar_url)
            ),
            statuses:flow_project_statuses(id, name, color, icon, position, is_done_status)
          `)
          .eq('id', projectId)
          .single();

        if (error) throw error;
        return data as FlowProject;
      },
      enabled: !!projectId,
    });
  };

  // Criar projeto
  const createMutation = useMutation({
    mutationFn: async (form: CreateProjectForm) => {
      if (!tenantId || !user?.id) throw new Error("Tenant ou usuário não definido");

      const { data, error } = await supabase
        .from('flow_projects')
        .insert({
          tenant_id: tenantId,
          creator_id: user.id,
          name: form.name,
          description: form.description || null,
          icon: form.icon || 'folder',
          color: form.color || '#6366f1',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flow-projects', tenantId] });
      toast.success("Projeto criado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao criar projeto", { description: error.message });
    },
  });

  // Atualizar projeto
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; description?: string; icon?: string; color?: string; is_archived?: boolean }) => {
      const { data, error } = await supabase
        .from('flow_projects')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['flow-projects', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['flow-project', data.id] });
      toast.success("Projeto atualizado!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao atualizar projeto", { description: error.message });
    },
  });

  // Arquivar projeto
  const archiveMutation = useMutation({
    mutationFn: async (projectId: string) => {
      const { error } = await supabase
        .from('flow_projects')
        .update({ is_archived: true })
        .eq('id', projectId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flow-projects', tenantId] });
      toast.success("Projeto arquivado");
    },
    onError: (error: Error) => {
      toast.error("Erro ao arquivar projeto", { description: error.message });
    },
  });

  return {
    projects: projectsQuery.data || [],
    isLoading: projectsQuery.isLoading,
    error: projectsQuery.error,
    useProject,
    createProject: createMutation.mutate,
    updateProject: updateMutation.mutate,
    archiveProject: archiveMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
  };
}
