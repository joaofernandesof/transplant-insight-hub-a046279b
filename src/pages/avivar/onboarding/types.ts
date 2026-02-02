/**
 * Avivar CRM Onboarding Types
 * Sistema de onboarding obrigatório com 8 etapas bloqueantes
 */

export type OnboardingStep = 
  | 'whatsapp_connected'
  | 'funnels_setup'
  | 'columns_setup'
  | 'ai_agent_created'
  | 'knowledge_base_setup'
  | 'ai_routing_configured'
  | 'column_checklists_setup'
  | 'crm_activated';

export interface OnboardingStepConfig {
  id: OnboardingStep;
  step: number;
  title: string;
  description: string;
  icon: string;
  blockingMessage: string;
  route?: string;
}

export interface OnboardingProgress {
  is_complete: boolean;
  current_step: number;
  steps: Record<OnboardingStep, boolean>;
  started_at: string;
  completed_at: string | null;
}

export const ONBOARDING_STEPS: OnboardingStepConfig[] = [
  {
    id: 'whatsapp_connected',
    step: 1,
    title: 'Conectar WhatsApp',
    description: 'Conecte seu WhatsApp para receber e enviar mensagens',
    icon: 'phone',
    blockingMessage: 'Conecte seu WhatsApp para continuar',
    route: '/avivar/integrations'
  },
  {
    id: 'funnels_setup',
    step: 2,
    title: 'Configurar Funis',
    description: 'Configure seus funis Comercial e Pós-Venda',
    icon: 'kanban',
    blockingMessage: 'Configure pelo menos um funil para continuar'
  },
  {
    id: 'columns_setup',
    step: 3,
    title: 'Configurar Colunas',
    description: 'Defina as etapas de cada funil e suas instruções',
    icon: 'columns',
    blockingMessage: 'Configure as colunas dos seus funis'
  },
  {
    id: 'ai_agent_created',
    step: 4,
    title: 'Criar Agente de IA',
    description: 'Configure sua assistente virtual de atendimento',
    icon: 'bot',
    blockingMessage: 'Crie um agente de IA para atender seus leads',
    route: '/avivar/config'
  },
  {
    id: 'knowledge_base_setup',
    step: 5,
    title: 'Base de Conhecimento',
    description: 'Adicione informações para sua IA responder corretamente',
    icon: 'book',
    blockingMessage: 'Configure a base de conhecimento do agente'
  },
  {
    id: 'ai_routing_configured',
    step: 6,
    title: 'Roteamento da IA',
    description: 'Defina em quais funis e colunas a IA vai atuar',
    icon: 'route',
    blockingMessage: 'Configure o roteamento do agente'
  },
  {
    id: 'column_checklists_setup',
    step: 7,
    title: 'Checklists de Coluna',
    description: 'Defina campos obrigatórios para cada etapa',
    icon: 'checklist',
    blockingMessage: 'Configure os checklists de bloqueio'
  },
  {
    id: 'crm_activated',
    step: 8,
    title: 'Ativar CRM',
    description: 'Revise tudo e ative seu CRM',
    icon: 'rocket',
    blockingMessage: 'Complete todas as etapas para ativar o CRM'
  }
];

export const getStepByNumber = (step: number): OnboardingStepConfig | undefined => {
  return ONBOARDING_STEPS.find(s => s.step === step);
};

export const getStepById = (id: OnboardingStep): OnboardingStepConfig | undefined => {
  return ONBOARDING_STEPS.find(s => s.id === id);
};

export const getNextStep = (currentStep: number): OnboardingStepConfig | undefined => {
  return ONBOARDING_STEPS.find(s => s.step === currentStep + 1);
};

export const getPreviousStep = (currentStep: number): OnboardingStepConfig | undefined => {
  return ONBOARDING_STEPS.find(s => s.step === currentStep - 1);
};

export const isStepComplete = (progress: OnboardingProgress, stepId: OnboardingStep): boolean => {
  return progress.steps[stepId] ?? false;
};

export const canAccessStep = (progress: OnboardingProgress, stepNumber: number): boolean => {
  // Só pode acessar etapa se a anterior está completa (ou é a primeira)
  if (stepNumber === 1) return true;
  const previousStep = getStepByNumber(stepNumber - 1);
  if (!previousStep) return false;
  return isStepComplete(progress, previousStep.id);
};
