/**
 * Componente que bloqueia acesso ao CRM se onboarding não está completo
 */

import React from 'react';
import { useAvivarOnboarding } from '../hooks/useAvivarOnboarding';
import { AvivarOnboardingWizard } from './AvivarOnboardingWizard';
import { Loader2 } from 'lucide-react';

interface OnboardingBlockerProps {
  children: React.ReactNode;
}

export function OnboardingBlocker({ children }: OnboardingBlockerProps) {
  const { onboardingStatus, isLoading, isComplete } = useAvivarOnboarding();

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[hsl(var(--avivar-background))]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--avivar-primary))]" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Se não completou o onboarding, mostrar wizard
  if (!isComplete) {
    return <AvivarOnboardingWizard />;
  }

  // CRM liberado
  return <>{children}</>;
}
