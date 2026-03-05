/**
 * Hook para gerenciar o estado da configuração do agente
 * Suporta criação de novos agentes e edição de agentes existentes
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { 
  AgentConfig, 
  INITIAL_CONFIG, 
  WIZARD_STEPS,
  DEFAULT_WEEK_SCHEDULE,
  PAYMENT_METHODS,
  EMPTY_IMAGE_GALLERY
} from '../types';

const STORAGE_KEY = 'avivar_agent_config';

// Converte dados do banco para o formato do AgentConfig
function mapAgentToConfig(agent: Record<string, unknown>): Partial<AgentConfig> {
  return {
    // Identificação do agente
    attendantName: (agent.name as string) || '',
    companyName: (agent.company_name as string) || '',
    professionalName: (agent.professional_name as string) || '',
    
    // Nicho e subnicho
    nicho: (agent.nicho as AgentConfig['nicho']) || null,
    subnicho: (agent.subnicho as AgentConfig['subnicho']) || null,
    template: (agent.subnicho as AgentConfig['template']) || null,
    
    // Dados do profissional
    crm: (agent.crm as string) || '',
    instagram: (agent.instagram as string) || '',
    
    // Localização
    companyPhone: (agent.company_phone as string) || '',
    address: (agent.address as string) || '',
    city: (agent.city as string) || '',
    state: (agent.state as string) || '',
    
    // Identidade e personalidade
    toneOfVoice: (agent.tone_of_voice as 'formal' | 'cordial' | 'casual') || 'cordial',
    aiIdentity: (agent.ai_identity as string) || (agent.personality as string) || '',
    aiObjective: (agent.ai_objective as string) || '',
    aiInstructions: (agent.ai_instructions as string) || '',
    aiRestrictions: (agent.ai_restrictions as string) || '',
    
    // Serviços e pagamentos
    services: (agent.services as AgentConfig['services']) || [],
    paymentMethods: (agent.payment_methods as AgentConfig['paymentMethods']) || [...PAYMENT_METHODS],
    consultationType: (agent.consultation_type as AgentConfig['consultationType']) || { presencial: true, online: false, domicilio: false },
    consultationDuration: (agent.consultation_duration as number) || 60,
    agentObjectives: (agent.agent_objectives as AgentConfig['agentObjectives']) || { primary: null, secondary: [], customObjectives: [] },
    
    // Imagens - migrar beforeAfterImages para imageGallery se existir
    beforeAfterImages: (agent.before_after_images as string[]) || [],
    imageGallery: (agent.image_gallery as AgentConfig['imageGallery']) || {
      ...EMPTY_IMAGE_GALLERY,
      before_after: ((agent.before_after_images as string[]) || []).map((url, i) => ({
        id: `legacy_${i}`,
        url,
        caption: '',
        category: 'before_after' as const
      }))
    },
    knowledgeFiles: (agent.knowledge_files as AgentConfig['knowledgeFiles']) || [],
    
    // Horários e fluxo
    schedule: (agent.schedule as typeof DEFAULT_WEEK_SCHEDULE) || DEFAULT_WEEK_SCHEDULE,
    fluxoAtendimento: (agent.fluxo_atendimento as AgentConfig['fluxoAtendimento']) || { passosCronologicos: [], passosExtras: [] },
    
    // API Key - assume validada se agente existe
    openaiApiKeyValid: true,
  };
}

export function useAgentConfig() {
  const { agentId } = useParams<{ agentId?: string }>();
  const isEditMode = !!agentId;
  
  const [loading, setLoading] = useState(isEditMode);
  const [editingAgentId, setEditingAgentId] = useState<string | null>(agentId || null);
  
  const [config, setConfig] = useState<AgentConfig>(() => {
    // Se estiver no modo edição, não carrega do localStorage
    if (agentId) {
      return { ...INITIAL_CONFIG };
    }
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...INITIAL_CONFIG, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Error loading config from localStorage:', error);
    }
    return INITIAL_CONFIG;
  });

  const [currentStep, setCurrentStep] = useState(isEditMode ? 1 : config.currentStep);

  // Carregar dados do agente se estiver em modo de edição
  useEffect(() => {
    async function loadAgent() {
      if (!agentId) return;
      
      setLoading(true);
      try {
        const { data: agent, error } = await supabase
          .from('avivar_agents')
          .select('*')
          .eq('id', agentId)
          .single();

        if (error) throw error;

        if (agent) {
          const mappedConfig = mapAgentToConfig(agent);
          setConfig(prev => ({
            ...prev,
            ...mappedConfig,
            openaiApiKeyValid: true, // Assume que já foi validada na criação
          }));
          setEditingAgentId(agent.id);
        }
      } catch (error) {
        console.error('Error loading agent:', error);
      } finally {
        setLoading(false);
      }
    }

    loadAgent();
  }, [agentId]);

  // Auto-save to localStorage (só para novos agentes)
  useEffect(() => {
    if (!isEditMode) {
      const updatedConfig = { ...config, currentStep, updatedAt: new Date().toISOString() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedConfig));
    }
  }, [config, currentStep, isEditMode]);

  const updateConfig = useCallback((updates: Partial<AgentConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const goToStep = useCallback((step: number) => {
    if (step >= 0 && step < WIZARD_STEPS.length) {
      setCurrentStep(step);
    }
  }, []);

  const resetConfig = useCallback(() => {
    setConfig({ ...INITIAL_CONFIG, createdAt: new Date().toISOString() });
    setCurrentStep(0);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const completeWizard = useCallback(() => {
    updateConfig({ isComplete: true, updatedAt: new Date().toISOString() });
  }, [updateConfig]);

  const progress = Math.round((currentStep / (WIZARD_STEPS.length - 1)) * 100);

  return {
    config,
    updateConfig,
    currentStep,
    setCurrentStep: goToStep,
    nextStep,
    prevStep,
    resetConfig,
    completeWizard,
    progress,
    totalSteps: WIZARD_STEPS.length,
    currentStepInfo: WIZARD_STEPS[currentStep],
    // Novos campos para modo de edição
    isEditMode,
    editingAgentId,
    loading,
  };
}
