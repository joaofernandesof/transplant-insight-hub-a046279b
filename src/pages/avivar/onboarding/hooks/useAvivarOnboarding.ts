/**
 * Hook para gerenciar o onboarding do Avivar CRM
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { OnboardingProgress, OnboardingStep, ONBOARDING_STEPS } from '../types';

export function useAvivarOnboarding() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Buscar status do onboarding
  const { data: onboardingStatus, isLoading, refetch } = useQuery({
    queryKey: ['avivar-onboarding', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .rpc('get_avivar_onboarding_status', { _user_id: user.id });
      
      if (error) {
        console.error('Error fetching onboarding status:', error);
        throw error;
      }
      
      return data as unknown as OnboardingProgress;
    },
    enabled: !!user?.id
  });

  // Atualizar etapa do onboarding
  const updateStep = useMutation({
    mutationFn: async ({ stepId, completed }: { stepId: OnboardingStep; completed: boolean }) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const stepConfig = ONBOARDING_STEPS.find(s => s.id === stepId);
      const updateData: Record<string, unknown> = {
        [stepId]: completed,
        last_step_completed_at: new Date().toISOString()
      };

      // Se completou, avançar current_step
      if (completed && stepConfig) {
        updateData.current_step = stepConfig.step + 1;
        
        // Se é a última etapa, marcar como completo
        if (stepConfig.step === 8) {
          updateData.completed_at = new Date().toISOString();
        }
      }

      const { error } = await supabase
        .from('avivar_onboarding_progress')
        .update(updateData)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: (_, { stepId, completed }) => {
      queryClient.invalidateQueries({ queryKey: ['avivar-onboarding'] });
      if (completed) {
        const stepConfig = ONBOARDING_STEPS.find(s => s.id === stepId);
        toast.success(`✓ ${stepConfig?.title} concluído!`);
      }
    },
    onError: (error) => {
      toast.error('Erro ao atualizar progresso: ' + error.message);
    }
  });

  // Verificar e atualizar etapas automaticamente
  const checkAndUpdateSteps = async () => {
    if (!user?.id) return;

    // 1. Verificar WhatsApp conectado
    const { data: whatsappInstance } = await supabase
      .from('avivar_uazapi_instances')
      .select('status')
      .eq('user_id', user.id)
      .eq('status', 'connected')
      .maybeSingle();

    if (whatsappInstance && !onboardingStatus?.steps.whatsapp_connected) {
      await updateStep.mutateAsync({ stepId: 'whatsapp_connected', completed: true });
    }

    // 2. Verificar funis configurados
    const { data: kanbans } = await supabase
      .from('avivar_kanbans')
      .select('id')
      .eq('user_id', user.id)
      .limit(1);

    if (kanbans && kanbans.length > 0 && !onboardingStatus?.steps.funnels_setup) {
      await updateStep.mutateAsync({ stepId: 'funnels_setup', completed: true });
    }

    // 3. Verificar colunas com instruções
    const { data: columns } = await supabase
      .from('avivar_kanban_columns')
      .select('id, ai_instruction, kanban_id')
      .in('kanban_id', kanbans?.map(k => k.id) || [])
      .not('ai_instruction', 'is', null);

    if (columns && columns.length >= 2 && !onboardingStatus?.steps.columns_setup) {
      await updateStep.mutateAsync({ stepId: 'columns_setup', completed: true });
    }

    // 4. Verificar agente de IA criado
    const { data: agents } = await supabase
      .from('avivar_agents')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .limit(1);

    if (agents && agents.length > 0 && !onboardingStatus?.steps.ai_agent_created) {
      await updateStep.mutateAsync({ stepId: 'ai_agent_created', completed: true });
    }

    // 5. Verificar base de conhecimento
    const { data: knowledge } = await supabase
      .from('avivar_knowledge_documents')
      .select('id')
      .eq('user_id', user.id)
      .limit(1);

    if (knowledge && knowledge.length > 0 && !onboardingStatus?.steps.knowledge_base_setup) {
      await updateStep.mutateAsync({ stepId: 'knowledge_base_setup', completed: true });
    }

    // 6. Verificar roteamento
    if (agents && agents.length > 0) {
      const { data: agentWithRouting } = await supabase
        .from('avivar_agents')
        .select('target_kanbans, target_stages')
        .eq('id', agents[0].id)
        .single();

      if (
        agentWithRouting?.target_kanbans?.length > 0 &&
        !onboardingStatus?.steps.ai_routing_configured
      ) {
        await updateStep.mutateAsync({ stepId: 'ai_routing_configured', completed: true });
      }
    }

    // 7. Verificar checklists de coluna
    const { data: checklists } = await supabase
      .from('avivar_column_checklists')
      .select('id, column_id')
      .limit(1);

    if (checklists && checklists.length > 0 && !onboardingStatus?.steps.column_checklists_setup) {
      await updateStep.mutateAsync({ stepId: 'column_checklists_setup', completed: true });
    }
  };

  // Ativar CRM manualmente
  const activateCRM = async () => {
    if (!onboardingStatus) return;
    
    // Verificar se todas as etapas anteriores estão completas
    const allPreviousComplete = ONBOARDING_STEPS
      .slice(0, 7)
      .every(step => onboardingStatus.steps[step.id]);

    if (!allPreviousComplete) {
      toast.error('Complete todas as etapas anteriores para ativar o CRM');
      return;
    }

    await updateStep.mutateAsync({ stepId: 'crm_activated', completed: true });
    toast.success('🚀 CRM Avivar ativado com sucesso!');
  };

  return {
    onboardingStatus,
    isLoading,
    isComplete: onboardingStatus?.is_complete ?? false,
    currentStep: onboardingStatus?.current_step ?? 1,
    updateStep: updateStep.mutate,
    checkAndUpdateSteps,
    activateCRM,
    refetch
  };
}
