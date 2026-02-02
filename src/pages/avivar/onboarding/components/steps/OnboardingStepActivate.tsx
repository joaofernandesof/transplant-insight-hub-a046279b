/**
 * Step 8: Ativar CRM
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { 
  CheckCircle2, 
  Rocket, 
  Phone, 
  Kanban, 
  Columns, 
  Bot, 
  BookOpen, 
  Route, 
  ListChecks,
  PartyPopper,
  Loader2
} from 'lucide-react';
import { useAvivarOnboarding } from '../../hooks/useAvivarOnboarding';
import { ONBOARDING_STEPS } from '../../types';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

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

export function OnboardingStepActivate() {
  const navigate = useNavigate();
  const { onboardingStatus, activateCRM, isComplete } = useAvivarOnboarding();
  const [isActivating, setIsActivating] = React.useState(false);

  // Verificar quantas etapas estão completas
  const completedSteps = ONBOARDING_STEPS.slice(0, 7).filter(
    step => onboardingStatus?.steps[step.id]
  );
  const allPreviousComplete = completedSteps.length === 7;

  const handleActivate = async () => {
    setIsActivating(true);
    try {
      await activateCRM();
      setTimeout(() => {
        navigate('/avivar');
      }, 2000);
    } finally {
      setIsActivating(false);
    }
  };

  if (isComplete) {
    return (
      <div className="text-center py-8 space-y-6">
        <div className="w-24 h-24 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
          <PartyPopper className="h-12 w-12 text-green-600" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-green-600">CRM Ativado!</h3>
          <p className="text-muted-foreground mt-2">
            Seu CRM Avivar está pronto para uso
          </p>
        </div>
        <Button
          onClick={() => navigate('/avivar')}
          className="gap-2 bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-accent))]"
        >
          Ir para o CRM
          <Rocket className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status */}
      <div className={cn(
        "p-4 rounded-xl border",
        allPreviousComplete
          ? "bg-green-500/10 border-green-500/30" 
          : "bg-amber-500/10 border-amber-500/30"
      )}>
        <div className="flex items-center gap-3">
          {allPreviousComplete ? (
            <CheckCircle2 className="h-6 w-6 text-green-600" />
          ) : (
            <Rocket className="h-6 w-6 text-amber-600" />
          )}
          <div>
            <p className="font-medium">
              {allPreviousComplete ? 'Tudo pronto para ativar!' : 'Complete as etapas anteriores'}
            </p>
            <p className="text-sm text-muted-foreground">
              {completedSteps.length} de 7 etapas concluídas
            </p>
          </div>
        </div>
      </div>

      {/* Resumo das etapas */}
      <div className="space-y-3">
        <h4 className="font-medium text-[hsl(var(--avivar-foreground))]">Resumo da Configuração</h4>
        
        <div className="grid gap-2">
          {ONBOARDING_STEPS.slice(0, 7).map((step) => {
            const Icon = STEP_ICONS[step.icon] || Rocket;
            const isComplete = onboardingStatus?.steps[step.id] ?? false;

            return (
              <Card 
                key={step.id}
                className={cn(
                  "p-3 flex items-center gap-3",
                  isComplete 
                    ? "bg-green-500/5 border-green-500/20" 
                    : "bg-[hsl(var(--avivar-secondary))] border-[hsl(var(--avivar-border))]"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center",
                  isComplete ? "bg-green-500/20" : "bg-muted"
                )}>
                  {isComplete ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <p className={cn(
                    "text-sm font-medium",
                    isComplete ? "text-green-600" : "text-[hsl(var(--avivar-foreground))]"
                  )}>
                    {step.title}
                  </p>
                </div>
                <Badge 
                  variant="outline"
                  className={cn(
                    isComplete 
                      ? "text-green-600 border-green-500/30" 
                      : "text-muted-foreground"
                  )}
                >
                  {isComplete ? 'Concluído' : 'Pendente'}
                </Badge>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Ação de ativação */}
      <div className="pt-4">
        <Button
          onClick={handleActivate}
          disabled={!allPreviousComplete || isActivating}
          className="w-full gap-2 py-6 text-lg bg-gradient-to-r from-[hsl(var(--avivar-primary))] to-[hsl(var(--avivar-accent))] hover:opacity-90 shadow-lg shadow-[hsl(var(--avivar-primary)/0.3)]"
        >
          {isActivating ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Rocket className="h-5 w-5" />
          )}
          {isActivating ? 'Ativando...' : 'Ativar CRM Avivar'}
        </Button>
        
        {!allPreviousComplete && (
          <p className="text-center text-sm text-muted-foreground mt-3">
            Complete todas as etapas anteriores para ativar o CRM
          </p>
        )}
      </div>
    </div>
  );
}
