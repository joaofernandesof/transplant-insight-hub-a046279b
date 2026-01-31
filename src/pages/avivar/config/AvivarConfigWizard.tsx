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
  StepPayment,
  StepImages,
  StepSchedule,
  StepCalendar,
  StepPersonalization,
  StepReview
} from './components/steps';
import { 
  SubnichoType, 
  NichoType,
  Service, 
  PaymentMethod, 
  ConsultationType, 
  WeekSchedule, 
  TomVoz 
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
    completeWizard
  } = useAgentConfig();

  // Get field config to check if registration is required
  const professionalFieldConfig = getProfessionalFieldConfig(config.nicho, config.subnicho);
  
  // Check if before/after step should be shown
  const showBeforeAfterStep = shouldShowBeforeAfterStep(config.nicho, config.subnicho);
  
  // Lista de etapas que devem ser puladas
  const isStepSkipped = (step: number): boolean => {
    // Etapa 9 (índice 9) é a de fotos antes/depois
    if (step === 9 && !showBeforeAfterStep) {
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

  // Step validation
  const canProceed = (): boolean => {
    switch (currentStep) {
      case 0: return true; // Welcome
      case 1: return config.subnicho !== null || config.template !== null; // Nicho/Subnicho
      case 2: return config.openaiApiKeyValid; // API Key
      case 3: {
        // Professional - require CRM only if showRegistration is true
        const hasName = !!config.professionalName;
        const hasRegistration = !professionalFieldConfig.showRegistration || !!config.crm;
        return hasName && hasRegistration;
      }
      case 4: return !!config.companyName && !!config.address && !!config.city && !!config.state; // Clinic
      case 5: return !!config.attendantName && config.attendantName.length >= 2; // Attendant
      case 6: return config.services.some(s => s.enabled); // Services
      case 7: return config.consultationType.presencial || config.consultationType.online || config.consultationType.domicilio; // Consultation
      case 8: return config.paymentMethods.some(m => m.enabled); // Payment
      case 9: return true; // Images (optional - only shown for relevant niches)
      case 10: return Object.values(config.schedule).some(d => d.enabled && d.intervals.length > 0); // Schedule
      case 11: return true; // Calendar (optional)
      case 12: return true; // Personalization (optional)
      case 13: return true; // Review
      default: return true;
    }
  };

  const handleComplete = () => {
    completeWizard();
    toast.success('Configuração salva com sucesso!');
    navigate('/avivar/config/knowledge');
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
          <StepPayment
            paymentMethods={config.paymentMethods}
            onChange={(methods: PaymentMethod[]) => updateConfig({ paymentMethods: methods })}
          />
        );
      
      case 9:
        return (
          <StepImages
            images={config.beforeAfterImages}
            onChange={(images) => updateConfig({ beforeAfterImages: images })}
          />
        );
      
      case 10:
        return (
          <StepSchedule
            schedule={config.schedule}
            onChange={(schedule: WeekSchedule) => updateConfig({ schedule })}
          />
        );
      
      case 11:
        return (
          <StepCalendar
            calendarEmail={config.calendarEmail}
            calendarConnected={config.calendarConnected}
            onChange={(email, connected) => updateConfig({ calendarEmail: email, calendarConnected: connected })}
          />
        );
      
      case 12:
        return (
          <StepPersonalization
            welcomeMessage={config.welcomeMessage}
            transferMessage={config.transferMessage}
            toneOfVoice={config.toneOfVoice}
            consultationDuration={config.consultationDuration}
            attendantName={config.attendantName}
            companyName={config.companyName}
            onChange={(field, value) => updateConfig({ [field]: value })}
          />
        );
      
      case 13:
        return (
          <StepReview
            config={config}
            onEdit={setCurrentStep}
            onComplete={handleComplete}
          />
        );
      
      default:
        return null;
    }
  };

  const isWelcomeStep = currentStep === 0;
  const isReviewStep = currentStep === totalSteps - 1;
  
  // Optional steps that can be skipped (adjusting for hidden steps)
  const getShowSkip = (): boolean => {
    // Step 9 (Images) - only show skip if it's visible
    if (currentStep === 9 && showBeforeAfterStep) return true;
    // Steps 11 (Calendar) and 12 (Personalization) are always optional
    if ([11, 12].includes(currentStep)) return true;
    return false;
  };
  const showSkip = getShowSkip();

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      {!isWelcomeStep && (
        <WizardProgress currentStep={currentStep} progress={progress} />
      )}

      {/* Step content */}
      <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
        <CardContent className="p-6">
          {renderStep()}
        </CardContent>
      </Card>

      {/* Navigation */}
      {!isWelcomeStep && !isReviewStep && (
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
