/**
 * Step 4: Criar Agente de IA
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { CheckCircle2, Bot, ArrowRight, Loader2, ExternalLink, Plus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAvivarOnboarding } from '../../hooks/useAvivarOnboarding';
import { cn } from '@/lib/utils';
import { Link, useNavigate } from 'react-router-dom';

interface Props {
  onComplete: () => void;
}

export function OnboardingStepAgent({ onComplete }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { updateStep, onboardingStatus } = useAvivarOnboarding();

  // Buscar agentes existentes
  const { data: agents, isLoading } = useQuery({
    queryKey: ['avivar-agents-onboarding', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('avivar_agents')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id
  });

  const hasAgent = agents && agents.length > 0;
  const isStepComplete = onboardingStatus?.steps.ai_agent_created ?? false;

  // Se já tem agente, marcar step como completo
  React.useEffect(() => {
    if (hasAgent && !isStepComplete) {
      updateStep({ stepId: 'ai_agent_created', completed: true });
    }
  }, [hasAgent, isStepComplete]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--avivar-primary))]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status */}
      <div className={cn(
        "p-4 rounded-xl border",
        hasAgent
          ? "bg-green-500/10 border-green-500/30" 
          : "bg-amber-500/10 border-amber-500/30"
      )}>
        <div className="flex items-center gap-3">
          {hasAgent ? (
            <CheckCircle2 className="h-6 w-6 text-green-600" />
          ) : (
            <Bot className="h-6 w-6 text-amber-600" />
          )}
          <div>
            <p className="font-medium">
              {hasAgent ? 'Agente de IA configurado!' : 'Crie seu agente de IA'}
            </p>
            <p className="text-sm text-muted-foreground">
              {hasAgent 
                ? `${agents?.length} agente(s) ativo(s)`
                : 'Configure uma assistente virtual para atender seus leads'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Lista de agentes ou CTA */}
      {hasAgent ? (
        <div className="space-y-3">
          {agents?.map((agent) => (
            <Card 
              key={agent.id}
              className="p-4 bg-[hsl(var(--avivar-secondary))] border-[hsl(var(--avivar-border))]"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[hsl(var(--avivar-primary))] to-[hsl(var(--avivar-accent))] flex items-center justify-center">
                    <Bot className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="font-medium">{agent.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {agent.personality || 'Personalidade não definida'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-500/20 text-green-600 border-green-500/30">
                    Ativo
                  </Badge>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/avivar/config">
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-6 text-center bg-[hsl(var(--avivar-secondary))] border-dashed">
          <Bot className="h-12 w-12 mx-auto mb-4 text-[hsl(var(--avivar-primary))]" />
          <h4 className="font-medium mb-2">Nenhum agente configurado</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Crie seu primeiro agente de IA para começar a atender leads automaticamente
          </p>
          <Button
            onClick={() => navigate('/avivar/config')}
            className="gap-2 bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-accent))]"
          >
            <Plus className="h-4 w-4" />
            Criar Agente de IA
          </Button>
        </Card>
      )}

      {/* Ações */}
      {hasAgent && (
        <div className="flex justify-end">
          <Button
            onClick={onComplete}
            className="gap-2 bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-accent))]"
          >
            Continuar
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
