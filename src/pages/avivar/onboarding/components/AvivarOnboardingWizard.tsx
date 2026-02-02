/**
 * Wizard de Onboarding do Avivar CRM
 * 8 etapas obrigatórias em sequência
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Phone,
  Kanban,
  Columns,
  Bot,
  BookOpen,
  Route,
  ListChecks,
  Rocket,
  Check,
  ChevronRight,
  Lock,
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import { useAvivarOnboarding } from '../hooks/useAvivarOnboarding';
import { ONBOARDING_STEPS, OnboardingStep, canAccessStep } from '../types';
import { 
  OnboardingStepWhatsApp,
  OnboardingStepFunnels,
  OnboardingStepColumns,
  OnboardingStepAgent,
  OnboardingStepKnowledge,
  OnboardingStepRouting,
  OnboardingStepChecklists,
  OnboardingStepActivate 
} from './steps';

const STEP_ICONS: Record<string, React.ElementType> = {
  phone: Phone,
  kanban: Kanban,
  columns: Columns,
  bot: Bot,
  book: BookOpen,
  route: Route,
  checklist: ListChecks,
  rocket: Rocket
};

export function AvivarOnboardingWizard() {
  const { onboardingStatus, currentStep, checkAndUpdateSteps } = useAvivarOnboarding();
  const [activeStep, setActiveStep] = useState(1);
  
  // Sincronizar com o step atual do backend
  useEffect(() => {
    if (currentStep) {
      setActiveStep(Math.min(currentStep, 8));
    }
  }, [currentStep]);

  // Verificar automaticamente ao montar
  useEffect(() => {
    checkAndUpdateSteps();
  }, []);

  const progress = ((activeStep - 1) / 8) * 100;

  const handleStepClick = (stepNumber: number) => {
    if (!onboardingStatus) return;
    if (canAccessStep(onboardingStatus, stepNumber)) {
      setActiveStep(stepNumber);
    }
  };

  const goToNextStep = () => {
    if (activeStep < 8) {
      setActiveStep(prev => prev + 1);
    }
  };

  const goToPreviousStep = () => {
    if (activeStep > 1) {
      setActiveStep(prev => prev - 1);
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 1:
        return <OnboardingStepWhatsApp onComplete={goToNextStep} />;
      case 2:
        return <OnboardingStepFunnels onComplete={goToNextStep} />;
      case 3:
        return <OnboardingStepColumns onComplete={goToNextStep} />;
      case 4:
        return <OnboardingStepAgent onComplete={goToNextStep} />;
      case 5:
        return <OnboardingStepKnowledge onComplete={goToNextStep} />;
      case 6:
        return <OnboardingStepRouting onComplete={goToNextStep} />;
      case 7:
        return <OnboardingStepChecklists onComplete={goToNextStep} />;
      case 8:
        return <OnboardingStepActivate />;
      default:
        return null;
    }
  };

  const currentStepConfig = ONBOARDING_STEPS[activeStep - 1];
  const StepIcon = STEP_ICONS[currentStepConfig?.icon] || Rocket;

  return (
    <div className="min-h-screen bg-[hsl(var(--avivar-background))]">
      {/* Header */}
      <div className="border-b border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-card))]">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[hsl(var(--avivar-primary))] to-[hsl(var(--avivar-accent))] flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg text-[hsl(var(--avivar-foreground))]">
                  Configuração do CRM Avivar
                </h1>
                <p className="text-sm text-muted-foreground">
                  Etapa {activeStep} de 8
                </p>
              </div>
            </div>
            <Badge variant="outline" className="text-[hsl(var(--avivar-primary))]">
              {Math.round(progress)}% concluído
            </Badge>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <Progress 
              value={progress} 
              className="h-2 bg-[hsl(var(--avivar-border))]"
            />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Steps List */}
          <div className="lg:col-span-1 space-y-2">
            {ONBOARDING_STEPS.map((step) => {
              const Icon = STEP_ICONS[step.icon] || Rocket;
              const isActive = step.step === activeStep;
              const isComplete = onboardingStatus?.steps[step.id] ?? false;
              const isLocked = !canAccessStep(onboardingStatus!, step.step);

              return (
                <button
                  key={step.id}
                  onClick={() => handleStepClick(step.step)}
                  disabled={isLocked}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all",
                    isActive 
                      ? "bg-[hsl(var(--avivar-primary))] text-white shadow-lg shadow-[hsl(var(--avivar-primary)/0.3)]"
                      : isComplete
                        ? "bg-green-500/10 text-green-600 hover:bg-green-500/20"
                        : isLocked
                          ? "bg-muted/50 text-muted-foreground cursor-not-allowed opacity-50"
                          : "bg-[hsl(var(--avivar-card))] hover:bg-[hsl(var(--avivar-secondary))] text-[hsl(var(--avivar-foreground))]"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center",
                    isActive 
                      ? "bg-white/20"
                      : isComplete
                        ? "bg-green-500/20"
                        : "bg-[hsl(var(--avivar-primary)/0.1)]"
                  )}>
                    {isComplete ? (
                      <Check className="h-4 w-4" />
                    ) : isLocked ? (
                      <Lock className="h-4 w-4" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-sm font-medium truncate",
                      isActive ? "text-white" : ""
                    )}>
                      {step.title}
                    </p>
                  </div>
                  {isActive && (
                    <ChevronRight className="h-4 w-4 flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[hsl(var(--avivar-primary))] to-[hsl(var(--avivar-accent))] flex items-center justify-center shadow-lg shadow-[hsl(var(--avivar-primary)/0.3)]">
                    <StepIcon className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-[hsl(var(--avivar-foreground))]">
                      {currentStepConfig?.title}
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                      {currentStepConfig?.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {renderStepContent()}
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex justify-between mt-6">
              <Button
                variant="outline"
                onClick={goToPreviousStep}
                disabled={activeStep === 1}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
              
              {activeStep < 8 && (
                <Button
                  onClick={goToNextStep}
                  disabled={!onboardingStatus?.steps[ONBOARDING_STEPS[activeStep - 1].id]}
                  className="gap-2 bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-accent))]"
                >
                  Próximo
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
