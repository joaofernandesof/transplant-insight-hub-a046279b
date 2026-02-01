/**
 * AvivarConfigWizard - Wizard de Configuração do Agente de IA
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useAgentConfig } from './hooks/useAgentConfig';
import { WizardProgress } from './components/WizardProgress';
import { WizardNavigation } from './components/WizardNavigation';
import {
  StepWelcome,
  StepTemplate,
  StepApiKey,
  StepProfessional,
  StepClinic,
  StepAttendant,
  StepServices,
  StepConsultation,
  StepObjectives,
  StepPayment,
  StepImages,
  StepSchedule,
  StepPersonalization,
  StepInstructions,
  StepFluxoAtendimento,
  StepKnowledge,
  StepReview,
  StepPromptReview
} from './components/steps';
import { 
  SubnichoType, 
  NichoType,
  Service, 
  PaymentMethod, 
  ConsultationType,
  AgentObjectives,
  WeekSchedule, 
  TomVoz,
  FluxoAtendimento,
  KnowledgeFile
} from './types';
import { getProfessionalFieldConfig, shouldShowBeforeAfterStep } from './nichoConfig';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function AvivarConfigWizard() {
  const navigate = useNavigate();
  const {
    config,
    updateConfig,
    currentStep,
    nextStep: baseNextStep,
    prevStep: basePrevStep,
    setCurrentStep,
    progress,
    totalSteps,
    completeWizard,
    isEditMode,
    editingAgentId,
    loading
  } = useAgentConfig();

  // Get field config to check if registration is required
  const professionalFieldConfig = getProfessionalFieldConfig(config.nicho, config.subnicho);
  
  // Check if before/after step should be shown
  const showBeforeAfterStep = shouldShowBeforeAfterStep(config.nicho, config.subnicho);
  
  // Lista de etapas que devem ser puladas
  const isStepSkipped = (step: number): boolean => {
    // Etapa 10 (índice 10) é a de fotos antes/depois (após adicionar objectives no índice 8)
    if (step === 10 && !showBeforeAfterStep) {
      return true;
    }
    return false;
  };

  // Navegação inteligente que pula etapas não aplicáveis
  const nextStep = () => {
    let next = currentStep + 1;
    while (next < totalSteps && isStepSkipped(next)) {
      next++;
    }
    if (next < totalSteps) {
      setCurrentStep(next);
    }
  };

  const prevStep = () => {
    let prev = currentStep - 1;
    while (prev >= 0 && isStepSkipped(prev)) {
      prev--;
    }
    if (prev >= 0) {
      setCurrentStep(prev);
    }
  };

  // Step validation - mais flexível no modo edição
  const canProceed = (): boolean => {
    switch (currentStep) {
      case 0: return true; // Welcome
      case 1: 
        // No modo edição, permitir prosseguir se já tem dados essenciais (nome do atendente)
        if (isEditMode && config.attendantName) return true;
        return config.subnicho !== null || config.template !== null;
      case 2: 
        // No modo edição, API key já foi validada antes
        return isEditMode || config.openaiApiKeyValid;
      case 3: {
        // Professional - require CRM only if showRegistration is true
        const hasName = !!config.professionalName;
        const hasRegistration = !professionalFieldConfig.showRegistration || !!config.crm;
        return hasName && hasRegistration;
      }
      case 4: 
        // No modo edição, ser mais flexível com localização
        if (isEditMode && config.companyName) return true;
        return !!config.companyName && !!config.address && !!config.city && !!config.state;
      case 5: return !!config.attendantName && config.attendantName.length >= 2; // Attendant
      case 6: 
        // No modo edição, permitir continuar se não tem serviços definidos
        return isEditMode || config.services.some(s => s.enabled);
      case 7: 
        // No modo edição, assumir presencial se não definido
        return isEditMode || config.consultationType.presencial || config.consultationType.online || config.consultationType.domicilio;
      case 8:
        // Objectives - precisa ter objetivo principal definido
        return isEditMode || !!config.agentObjectives.primary;
      case 9: 
        // No modo edição, pagamento é opcional
        return isEditMode || config.paymentMethods.some(m => m.enabled);
      case 10: return true; // Images (optional)
      case 11: 
        // No modo edição, schedule é opcional
        return isEditMode || Object.values(config.schedule).some(d => d.enabled && d.intervals.length > 0);
      case 12: return true; // Personalization (optional)
      case 13: return true; // Instructions (optional)
      case 14: return true; // Fluxo (optional)
      case 15: return true; // Knowledge (optional)
      case 16: return true; // Review
      case 17: return true; // Prompt Review
      default: return true;
    }
  };

  const handleComplete = (editedPrompt?: string) => {
    // TODO: Save editedPrompt if provided
    completeWizard();
    toast.success('Agente configurado com sucesso!');
    navigate('/avivar/agents');
  };

  // Handler para seleção de subnicho (atualiza nicho e template também)
  const handleSubnichoSelect = (subnicho: SubnichoType) => {
    updateConfig({ 
      subnicho, 
      template: subnicho // Mantém compatibilidade com o campo template
    });
  };

  const handleNichoSelect = (nicho: NichoType) => {
    updateConfig({ nicho });
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <StepWelcome onStart={nextStep} />;
      
      case 1:
        return (
          <StepTemplate
            selected={config.subnicho || config.template}
            onSelect={handleSubnichoSelect}
            onNichoSelect={handleNichoSelect}
            selectedNicho={config.nicho}
          />
        );
      
      case 2:
        return (
          <StepApiKey
            apiKey={config.openaiApiKey}
            isValid={config.openaiApiKeyValid}
            onChange={(key, valid) => updateConfig({ openaiApiKey: key, openaiApiKeyValid: valid })}
          />
        );
      
      case 3:
        return (
          <StepProfessional
            professionalName={config.professionalName}
            crm={config.crm}
            instagram={config.instagram}
            onChange={(field, value) => updateConfig({ [field]: value })}
            nicho={config.nicho}
            subnicho={config.subnicho}
          />
        );
      
      case 4:
        return (
          <StepClinic
            companyName={config.companyName}
            address={config.address}
            city={config.city}
            state={config.state}
            onChange={(field, value) => updateConfig({ [field]: value })}
            nicho={config.nicho}
            subnicho={config.subnicho}
          />
        );
      
      case 5:
        return (
          <StepAttendant
            attendantName={config.attendantName}
            companyName={config.companyName}
            onChange={(name) => updateConfig({ attendantName: name })}
          />
        );
      
      case 6:
        return (
          <StepServices
            services={config.services}
            onChange={(services: Service[]) => updateConfig({ services })}
            nicho={config.nicho}
            subnicho={config.subnicho}
          />
        );
      
      case 7:
        return (
          <StepConsultation
            consultationType={config.consultationType}
            city={config.city}
            state={config.state}
            onChange={(type: ConsultationType) => updateConfig({ consultationType: type })}
            nicho={config.nicho}
            subnicho={config.subnicho}
          />
        );
      
      case 8:
        return (
          <StepObjectives
            objectives={config.agentObjectives}
            onChange={(objectives: AgentObjectives) => updateConfig({ agentObjectives: objectives })}
            nicho={config.nicho}
            subnicho={config.subnicho}
          />
        );
      
      case 9:
        return (
          <StepPayment
            paymentMethods={config.paymentMethods}
            onChange={(methods: PaymentMethod[]) => updateConfig({ paymentMethods: methods })}
          />
        );
      
      case 10:
        return (
          <StepImages
            images={config.beforeAfterImages}
            onChange={(images) => updateConfig({ beforeAfterImages: images })}
          />
        );
      
      case 11:
        return (
          <StepSchedule
            schedule={config.schedule}
            onChange={(schedule: WeekSchedule) => updateConfig({ schedule })}
          />
        );
      
      case 12:
        return (
          <StepPersonalization
            aiIdentity={config.aiIdentity}
            aiObjective={config.aiObjective}
            toneOfVoice={config.toneOfVoice}
            consultationDuration={config.consultationDuration}
            attendantName={config.attendantName}
            companyName={config.companyName}
            nicho={config.nicho}
            subnicho={config.subnicho}
            onChange={(field, value) => updateConfig({ [field]: value })}
          />
        );
      
      case 13:
        return (
          <StepInstructions
            aiInstructions={config.aiInstructions}
            aiRestrictions={config.aiRestrictions}
            attendantName={config.attendantName}
            companyName={config.companyName}
            nicho={config.nicho}
            subnicho={config.subnicho}
            onChange={(field, value) => updateConfig({ [field]: value })}
          />
        );
      
      case 14:
        return (
          <StepFluxoAtendimento
            fluxoAtendimento={config.fluxoAtendimento}
            attendantName={config.attendantName}
            companyName={config.companyName}
            nicho={config.nicho}
            subnicho={config.subnicho}
            onChange={(fluxo: FluxoAtendimento) => updateConfig({ fluxoAtendimento: fluxo })}
          />
        );
      
      case 15:
        return (
          <StepKnowledge
            knowledgeFiles={config.knowledgeFiles}
            onChange={(files: KnowledgeFile[]) => updateConfig({ knowledgeFiles: files })}
          />
        );
      
      case 16:
        return (
          <StepReview
            config={config}
            onEdit={setCurrentStep}
            onComplete={handleComplete}
            onPrev={prevStep}
          />
        );
      
      default:
        return null;
    }
  };

  // In edit mode, skip welcome step
  const isWelcomeStep = currentStep === 0 && !isEditMode;
  const isReviewStep = currentStep === 16; // Step 16 is the final review step (after adding objectives)
  
  // Optional steps that can be skipped (adjusting for hidden steps)
  const getShowSkip = (): boolean => {
    // Step 10 (Images) - only show skip if it's visible
    if (currentStep === 10 && showBeforeAfterStep) return true;
    // Step 12 (Personalization), Step 13 (Instructions), Step 14 (Fluxo), Step 15 (Knowledge) are always optional
    if (currentStep === 12 || currentStep === 13 || currentStep === 14 || currentStep === 15) return true;
    return false;
  };
  const showSkip = getShowSkip();

  // Show loading while fetching agent data in edit mode
  if (loading) {
    return (
      <div className="p-6 space-y-6 max-w-4xl mx-auto flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin h-8 w-8 border-4 border-[hsl(var(--avivar-primary))] border-t-transparent rounded-full mx-auto" />
          <p className="text-[hsl(var(--avivar-muted-foreground))]">Carregando configurações do agente...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header with Edit Mode indicator */}
      {(!isWelcomeStep || isEditMode) && (
        <>
          {isEditMode && (
            <div className="flex items-center gap-2 text-sm text-[hsl(var(--avivar-primary))] bg-[hsl(var(--avivar-primary)/0.1)] px-4 py-2 rounded-lg border border-[hsl(var(--avivar-primary)/0.3)]">
              <span>✏️</span>
              <span>Modo Edição - Alterações serão salvas no agente existente</span>
            </div>
          )}
          <WizardProgress currentStep={currentStep} progress={progress} />
        </>
      )}

      {/* Step content */}
      <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
        <CardContent className="p-6">
          {renderStep()}
        </CardContent>
      </Card>

      {/* Navigation - Hide on welcome and review steps */}
      {(!isWelcomeStep || isEditMode) && !isReviewStep && (
        <WizardNavigation
          currentStep={currentStep}
          totalSteps={totalSteps}
          onPrev={prevStep}
          onNext={nextStep}
          onSkip={showSkip ? nextStep : undefined}
          canProceed={canProceed()}
          showSkip={showSkip}
        />
      )}
    </div>
  );
}
