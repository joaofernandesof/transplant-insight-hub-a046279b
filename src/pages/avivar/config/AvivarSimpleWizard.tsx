/**
 * AvivarSimpleWizard - Wizard Simplificado de 5 etapas
 * Substitui o wizard de 15 etapas para facilitar para PMEs
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

import {
  StepSelectBusiness,
  StepBusinessInfo,
  StepServicesSimple,
  StepConsultationSimple,
  StepObjectivesSimple,
  StepFAQGenerator,
  StepKnowledgeSimple,
  StepImagesSimple,
  StepReviewSimple,
} from './components/steps/simple';

import { autoGenerateConfig } from './utils/autoGenerateConfig';
import { 
  AgentConfig, 
  INITIAL_CONFIG, 
  EMPTY_IMAGE_GALLERY,
  PAYMENT_METHODS,
  DEFAULT_WEEK_SCHEDULE,
  NichoType,
  SubnichoType,
} from './types';

interface FAQItem {
  id: string;
  pergunta: string;
  resposta: string;
}

// Tracks if FAQ was added to knowledge base
const useFAQAddedToKnowledge = () => {
  const [faqAddedToKnowledge, setFaqAddedToKnowledge] = useState(false);
  return { faqAddedToKnowledge, setFaqAddedToKnowledge };
};

const SIMPLE_STEPS = [
  { id: 'business', title: 'Tipo de Negócio', description: 'Qual é seu segmento?' },
  { id: 'info', title: 'Sua Empresa', description: 'Informações básicas' },
  { id: 'services', title: 'Serviços', description: 'O que você oferece?' },
  { id: 'consultation', title: 'Atendimento', description: 'Como você atende?' },
  { id: 'objectives', title: 'Objetivos', description: 'Foco do agente' },
  { id: 'faq', title: 'FAQ', description: 'Perguntas frequentes' },
  { id: 'knowledge', title: 'Documentos', description: 'Base de conhecimento (opcional)' },
  { id: 'images', title: 'Imagens', description: 'Galeria para envio (opcional)' },
  { id: 'review', title: 'Finalizar', description: 'Revisar e criar' },
];

export default function AvivarSimpleWizard() {
  const navigate = useNavigate();
  const { agentId } = useParams<{ agentId?: string }>();
  const isEditMode = !!agentId;

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [generatedFAQ, setGeneratedFAQ] = useState<FAQItem[]>([]);
  const [faqAddedToKnowledge, setFaqAddedToKnowledge] = useState(false);
  const [isViewingSubnichos, setIsViewingSubnichos] = useState(false); // Para controlar navegação do step 0
  const [forceNichosView, setForceNichosView] = useState(false); // Para forçar volta aos nichos
  const [config, setConfig] = useState<AgentConfig>(() => ({
    ...INITIAL_CONFIG,
    paymentMethods: [...PAYMENT_METHODS],
    schedule: DEFAULT_WEEK_SCHEDULE,
    createdAt: new Date().toISOString(),
  }));

  // Carregar agente existente se em modo de edição
  useEffect(() => {
    if (!agentId) return;

    async function loadAgent() {
      setLoading(true);
      try {
        const { data: agent, error } = await supabase
          .from('avivar_agents')
          .select('*')
          .eq('id', agentId)
          .single();

        if (error) throw error;

        if (agent) {
          setConfig(prev => ({
            ...prev,
            nicho: agent.nicho as NichoType || null,
            subnicho: agent.subnicho as SubnichoType || null,
            template: agent.subnicho as SubnichoType || null,
            companyName: agent.company_name || '',
            address: agent.address || '',
            city: agent.city || '',
            state: agent.state || '',
            businessUnits: (agent.business_units as unknown as AgentConfig['businessUnits']) || [],
            professionalName: agent.professional_name || '',
            crm: agent.crm || '',
            attendantName: agent.name || '',
            services: (agent.services as unknown as AgentConfig['services']) || [],
            paymentMethods: (agent.payment_methods as unknown as AgentConfig['paymentMethods']) || [...PAYMENT_METHODS],
            schedule: (agent.schedule as unknown as AgentConfig['schedule']) || DEFAULT_WEEK_SCHEDULE,
            toneOfVoice: (agent.tone_of_voice as 'formal' | 'cordial' | 'casual') || 'cordial',
            aiIdentity: agent.ai_identity || '',
            aiObjective: agent.ai_objective || '',
            aiInstructions: agent.ai_instructions || '',
            aiRestrictions: agent.ai_restrictions || '',
            consultationType: (agent.consultation_type as unknown as AgentConfig['consultationType']) || { presencial: true, online: false, domicilio: false },
            consultationDuration: agent.consultation_duration || 60,
            // agentObjectives não existe na tabela, será preenchido na próxima etapa
            beforeAfterImages: (agent.before_after_images as unknown as string[]) || [],
            imageGallery: (agent.image_gallery as unknown as AgentConfig['imageGallery']) || {
              ...EMPTY_IMAGE_GALLERY,
              before_after: (((agent.before_after_images as unknown as string[]) || [])).map((url, i) => ({
                id: `legacy_${i}`,
                url,
                caption: '',
                category: 'before_after' as const,
              })),
            },
            knowledgeFiles: (agent.knowledge_files as unknown as AgentConfig['knowledgeFiles']) || [],
            fluxoAtendimento: (agent.fluxo_atendimento as unknown as AgentConfig['fluxoAtendimento']) || { passosCronologicos: [], passosExtras: [] },
          }));
        }
      } catch (error) {
        console.error('Error loading agent:', error);
        toast.error('Erro ao carregar agente');
      } finally {
        setLoading(false);
      }
    }

    loadAgent();
  }, [agentId]);

  const updateConfig = (updates: Partial<AgentConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const progress = ((currentStep + 1) / SIMPLE_STEPS.length) * 100;

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 0: // Tipo de negócio
        return !!config.subnicho;
      case 1: // Info da empresa
        return !!config.companyName && !!config.city && !!config.state && !!config.professionalName && !!config.attendantName;
      case 2: // Serviços
        return config.services.some(s => s.enabled);
      case 3: // Tipo de atendimento
        return config.consultationType.presencial || config.consultationType.online || config.consultationType.domicilio;
      case 4: // Objetivos
        return !!config.agentObjectives?.primary;
      case 5: // FAQ - se há FAQ gerado, precisa adicionar à base primeiro
        if (generatedFAQ.length > 0 && !faqAddedToKnowledge) {
          return false;
        }
        return true;
      case 6: // Knowledge (opcional - sempre pode prosseguir)
        return true;
      case 7: {
        // Imagens - se tiver imagens, todas precisam ter legenda
        const allImages = Object.values(config.imageGallery || {}).flat();
        if (allImages.length === 0) return true; // Sem imagens, pode prosseguir
        return allImages.every(img => img?.caption?.trim()); // Todas precisam ter legenda
      }
      case 8: // Review
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (currentStep < SIMPLE_STEPS.length - 1 && canProceed()) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    // No step 0, se estiver vendo subnichos, voltar para nichos
    if (currentStep === 0 && isViewingSubnichos) {
      setForceNichosView(true);
      setIsViewingSubnichos(false);
      return;
    }
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Reset forceNichosView quando o componente notificar que está vendo subnichos novamente
  const handleViewingSubnichos = (viewing: boolean) => {
    setIsViewingSubnichos(viewing);
    if (viewing) {
      setForceNichosView(false);
    }
  };

  const handleBusinessSelect = (nicho: NichoType, subnicho: SubnichoType, allSubnichos?: SubnichoType[]) => {
    updateConfig({ 
      nicho, 
      subnicho, 
      subnichos: allSubnichos || [subnicho],
      template: subnicho 
    });
  };

  const handleComplete = async (agentName: string) => {
    setSaving(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Você precisa estar logado para criar um agente');
        navigate('/login');
        return;
      }

      // Auto-gerar configurações de IA
      const autoConfig = autoGenerateConfig(
        config.nicho,
        config.subnicho,
        config.attendantName,
        config.companyName,
        config.professionalName
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const agentPayload: any = {
        user_id: user.id,
        name: config.attendantName,
        company_name: config.companyName,
        professional_name: config.professionalName,
        nicho: config.nicho,
        subnicho: config.subnicho,
        crm: config.crm || null,
        address: config.address || null,
        city: config.city,
        state: config.state,
        business_units: config.businessUnits || [],
        services: config.services,
        payment_methods: config.paymentMethods,
        schedule: config.schedule,
        consultation_type: config.consultationType,
        consultation_duration: config.consultationDuration,
        // Imagens (novo formato) + compatibilidade com legado
        image_gallery: config.imageGallery || EMPTY_IMAGE_GALLERY,
        before_after_images: (config.imageGallery?.before_after?.length
          ? config.imageGallery.before_after.map((img) => img.url)
          : (config.beforeAfterImages || []))
          .filter(Boolean),
        tone_of_voice: autoConfig.toneOfVoice,
        ai_identity: autoConfig.aiIdentity,
        ai_objective: autoConfig.aiObjective,
        ai_instructions: autoConfig.aiInstructions,
        ai_restrictions: autoConfig.aiRestrictions,
        fluxo_atendimento: autoConfig.fluxoAtendimento,
        personality: autoConfig.aiIdentity,
        knowledge_files: config.knowledgeFiles || [],
        is_active: true,
        updated_at: new Date().toISOString(),
      };

      if (isEditMode && agentId) {
        // Atualizar agente existente
        const { error } = await supabase
          .from('avivar_agents')
          .update(agentPayload)
          .eq('id', agentId);

        if (error) throw error;
        toast.success('Agente atualizado com sucesso!');
      } else {
        // Criar novo agente
        const { error } = await supabase
          .from('avivar_agents')
          .insert(agentPayload);

        if (error) throw error;
        toast.success('Agente criado com sucesso! 🎉');
      }

      navigate('/avivar/agents');
    } catch (error) {
      console.error('Error saving agent:', error);
      toast.error('Erro ao salvar agente. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin h-8 w-8 border-4 border-[hsl(var(--avivar-primary))] border-t-transparent rounded-full mx-auto" />
          <p className="text-[hsl(var(--avivar-muted-foreground))]">Carregando...</p>
        </div>
      </div>
    );
  }

  const handleCopyFAQToKnowledge = (content: string) => {
    const faqFile = {
      id: `faq_${Date.now()}`,
      name: 'FAQ_Gerado_IA.md',
      content,
      size: content.length,
      type: 'text/markdown',
    };
    updateConfig({ knowledgeFiles: [...(config.knowledgeFiles || []), faqFile] });
    setFaqAddedToKnowledge(true); // Mark as added
  };

  // Reset faqAddedToKnowledge when FAQ is regenerated
  const handleFAQChange = (faq: FAQItem[]) => {
    setGeneratedFAQ(faq);
    // If FAQ changes after being added, require adding again
    if (faqAddedToKnowledge && faq.length > 0) {
      setFaqAddedToKnowledge(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <StepSelectBusiness
            selectedNicho={config.nicho}
            selectedSubnicho={config.subnicho}
            selectedSubnichos={config.subnichos}
            onSelect={handleBusinessSelect}
            onViewingSubnichos={handleViewingSubnichos}
            forceShowNichos={forceNichosView}
          />
        );
      case 1:
        return (
          <StepBusinessInfo
            companyName={config.companyName}
            address={config.address}
            city={config.city}
            state={config.state}
            professionalName={config.professionalName}
            crm={config.crm}
            attendantName={config.attendantName}
            nicho={config.nicho}
            subnicho={config.subnicho}
            businessUnits={config.businessUnits || []}
            onChange={(field, value) => updateConfig({ [field]: value })}
          />
        );
      case 2:
        return (
          <StepServicesSimple
            services={config.services}
            paymentMethods={config.paymentMethods}
            nicho={config.nicho}
            subnicho={config.subnicho}
            onServicesChange={(services) => updateConfig({ services })}
            onPaymentsChange={(paymentMethods) => updateConfig({ paymentMethods })}
          />
        );
      case 3:
        return (
          <StepConsultationSimple
            consultationType={config.consultationType}
            city={config.city}
            state={config.state}
            onChange={(consultationType) => updateConfig({ consultationType })}
            nicho={config.nicho}
            subnicho={config.subnicho}
          />
        );
      case 4:
        return (
          <StepObjectivesSimple
            objectives={config.agentObjectives}
            onChange={(agentObjectives) => updateConfig({ agentObjectives })}
            nicho={config.nicho}
            subnicho={config.subnicho}
          />
        );
      case 5:
        return (
          <StepFAQGenerator
            nicho={config.nicho}
            subnicho={config.subnicho}
            companyName={config.companyName}
            services={config.services}
            objectives={config.agentObjectives}
            generatedFAQ={generatedFAQ}
            onFAQChange={handleFAQChange}
            onCopyToKnowledge={handleCopyFAQToKnowledge}
            onSkip={handleNext}
          />
        );
      case 6:
        return (
          <StepKnowledgeSimple
            knowledgeFiles={config.knowledgeFiles || []}
            onFilesChange={(files) => updateConfig({ knowledgeFiles: files })}
            onSkip={handleNext}
          />
        );
      case 7:
        return (
          <StepImagesSimple
            gallery={config.imageGallery}
            onChange={(imageGallery) => updateConfig({ imageGallery })}
          />
        );
      case 8:
        return (
          <StepReviewSimple
            config={config}
            onComplete={handleComplete}
            onEdit={setCurrentStep}
            isLoading={saving}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-[hsl(var(--avivar-muted-foreground))]">
          <span>Etapa {currentStep + 1} de {SIMPLE_STEPS.length}</span>
          <span>{SIMPLE_STEPS[currentStep].title}</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Edit Mode Indicator */}
      {isEditMode && (
        <div className="flex items-center gap-2 text-sm text-[hsl(var(--avivar-primary))] bg-[hsl(var(--avivar-primary)/0.1)] px-4 py-2 rounded-lg border border-[hsl(var(--avivar-primary)/0.3)]">
          <span>✏️</span>
          <span>Modo Edição - Alterando agente existente</span>
        </div>
      )}

      {/* Step Content */}
      <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
        <CardContent className="p-6">
          {renderStep()}
        </CardContent>
      </Card>

      {/* Navigation (not shown on review step) */}
      {currentStep < SIMPLE_STEPS.length - 1 && (
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentStep === 0 && !isViewingSubnichos}
            className="border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))]"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Voltar
          </Button>

          {/* Show tooltip when FAQ needs to be added */}
          {currentStep === 5 && generatedFAQ.length > 0 && !faqAddedToKnowledge ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button
                      disabled
                      className="bg-[hsl(var(--avivar-muted))] text-[hsl(var(--avivar-muted-foreground))] cursor-not-allowed opacity-50"
                    >
                      Próximo
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))]">
                  <p>Clique em "Adicionar à Base de Conhecimento"</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-primary)/0.9)]"
            >
              Próximo
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
