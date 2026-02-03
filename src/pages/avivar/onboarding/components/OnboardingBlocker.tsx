/**
 * Componente que bloqueia acesso ao CRM se onboarding não está completo
 * Inclui JourneySelector como primeira tela
 */

import React, { useState, useEffect } from 'react';
import { useAvivarOnboarding } from '../hooks/useAvivarOnboarding';
import { AvivarOnboardingWizard } from './AvivarOnboardingWizard';
import { JourneySelector, JourneyPath } from './JourneySelector';
import { Loader2 } from 'lucide-react';

interface OnboardingBlockerProps {
  children: React.ReactNode;
}

const JOURNEY_STORAGE_KEY = 'avivar_journey_path';

export function OnboardingBlocker({ children }: OnboardingBlockerProps) {
  const { onboardingStatus, isLoading, isComplete } = useAvivarOnboarding();
  const [selectedJourney, setSelectedJourney] = useState<JourneyPath | null>(null);
  const [isCheckingJourney, setIsCheckingJourney] = useState(true);

  // Verificar se já escolheu uma jornada
  useEffect(() => {
    const savedJourney = localStorage.getItem(JOURNEY_STORAGE_KEY) as JourneyPath | null;
    if (savedJourney) {
      setSelectedJourney(savedJourney);
    }
    setIsCheckingJourney(false);
  }, []);

  const handleSelectJourney = (path: JourneyPath) => {
    localStorage.setItem(JOURNEY_STORAGE_KEY, path);
    setSelectedJourney(path);
  };

  // Loading state
  if (isLoading || isCheckingJourney) {
    return (
      <div className="flex items-center justify-center h-screen bg-[hsl(var(--avivar-background))]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--avivar-primary))]" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Se onboarding completo, liberar CRM
  if (isComplete) {
    return <>{children}</>;
  }

  // Se não escolheu jornada ainda, mostrar seletor
  if (!selectedJourney) {
    return <JourneySelector onSelectPath={handleSelectJourney} />;
  }

  // Mostrar wizard do onboarding
  return <AvivarOnboardingWizard initialPath={selectedJourney} />;
}
