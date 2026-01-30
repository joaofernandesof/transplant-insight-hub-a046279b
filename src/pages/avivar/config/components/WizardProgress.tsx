/**
 * Barra de progresso do wizard
 */

import React from 'react';
import { Progress } from '@/components/ui/progress';
import { WIZARD_STEPS } from '../types';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface WizardProgressProps {
  currentStep: number;
  progress: number;
}

export function WizardProgress({ currentStep, progress }: WizardProgressProps) {
  const currentInfo = WIZARD_STEPS[currentStep];

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-[hsl(var(--avivar-muted-foreground))]">
            Etapa {currentStep + 1} de {WIZARD_STEPS.length}
          </span>
          <span className="font-medium text-[hsl(var(--avivar-foreground))]">
            {progress}% concluído
          </span>
        </div>
        <Progress 
          value={progress} 
          className="h-2 bg-[hsl(var(--avivar-muted))]"
        />
      </div>

      {/* Current step info */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[hsl(var(--avivar-primary))] flex items-center justify-center text-white font-bold">
          {currentStep + 1}
        </div>
        <div>
          <h3 className="font-semibold text-[hsl(var(--avivar-foreground))]">
            {currentInfo?.title}
          </h3>
          <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">
            {currentInfo?.description}
          </p>
        </div>
      </div>

      {/* Step indicators */}
      <div className="flex gap-1 overflow-x-auto pb-2">
        {WIZARD_STEPS.map((step, index) => (
          <div
            key={step.id}
            className={cn(
              "flex-shrink-0 w-8 h-1 rounded-full transition-colors",
              index < currentStep && "bg-[hsl(var(--avivar-primary))]",
              index === currentStep && "bg-[hsl(var(--avivar-accent))]",
              index > currentStep && "bg-[hsl(var(--avivar-muted))]"
            )}
            title={step.title}
          />
        ))}
      </div>
    </div>
  );
}
