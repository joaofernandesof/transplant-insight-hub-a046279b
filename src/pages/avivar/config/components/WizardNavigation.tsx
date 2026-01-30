/**
 * Navegação do wizard (botões Voltar/Próximo)
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, SkipForward } from 'lucide-react';

interface WizardNavigationProps {
  currentStep: number;
  totalSteps: number;
  onPrev: () => void;
  onNext: () => void;
  onSkip?: () => void;
  canProceed?: boolean;
  isLoading?: boolean;
  showSkip?: boolean;
  nextLabel?: string;
  prevLabel?: string;
}

export function WizardNavigation({
  currentStep,
  totalSteps,
  onPrev,
  onNext,
  onSkip,
  canProceed = true,
  isLoading = false,
  showSkip = false,
  nextLabel,
  prevLabel
}: WizardNavigationProps) {
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;

  return (
    <div className="flex items-center justify-between pt-6 border-t border-[hsl(var(--avivar-border))]">
      <Button
        variant="outline"
        onClick={onPrev}
        disabled={isFirstStep || isLoading}
        className="border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))] hover:bg-[hsl(var(--avivar-muted))]"
      >
        <ChevronLeft className="h-4 w-4 mr-2" />
        {prevLabel || 'Voltar'}
      </Button>

      <div className="flex gap-2">
        {showSkip && onSkip && (
          <Button
            variant="ghost"
            onClick={onSkip}
            disabled={isLoading}
            className="text-[hsl(var(--avivar-muted-foreground))] hover:text-[hsl(var(--avivar-foreground))]"
          >
            <SkipForward className="h-4 w-4 mr-2" />
            Pular
          </Button>
        )}

        <Button
          onClick={onNext}
          disabled={!canProceed || isLoading}
          className="bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-accent))] text-white"
        >
          {isLoading ? (
            <span className="flex items-center">
              <span className="animate-spin mr-2">⏳</span>
              Validando...
            </span>
          ) : (
            <>
              {nextLabel || (isLastStep ? 'Finalizar' : 'Próximo')}
              {!isLastStep && <ChevronRight className="h-4 w-4 ml-2" />}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
