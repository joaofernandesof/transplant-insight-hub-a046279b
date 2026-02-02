/**
 * Step 6: Roteamento da IA
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle2, Route, ArrowRight, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAvivarOnboarding } from '../../hooks/useAvivarOnboarding';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Props {
  onComplete: () => void;
}

export function OnboardingStepRouting({ onComplete }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { updateStep, onboardingStatus } = useAvivarOnboarding();

  // Buscar agente e kanbans
  const { data: agent, isLoading: loadingAgent } = useQuery({
    queryKey: ['avivar-agent-routing', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('avivar_agents')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user?.id
  });

  const { data: kanbans, isLoading: loadingKanbans } = useQuery({
    queryKey: ['avivar-kanbans-routing', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('avivar_kanbans')
        .select('id, name')
        .eq('user_id', user.id)
        .order('order_index');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id
  });

  const [selectedKanbans, setSelectedKanbans] = React.useState<string[]>(
    agent?.target_kanbans || []
  );

  React.useEffect(() => {
    if (agent?.target_kanbans) {
      setSelectedKanbans(agent.target_kanbans);
    }
  }, [agent]);

  const hasRouting = selectedKanbans.length > 0;
  const isStepComplete = onboardingStatus?.steps.ai_routing_configured ?? false;

  // Mutation para salvar roteamento
  const saveRouting = useMutation({
    mutationFn: async () => {
      if (!agent?.id) throw new Error('Agente não encontrado');
      
      const { error } = await supabase
        .from('avivar_agents')
        .update({ 
          target_kanbans: selectedKanbans,
          target_stages: [] // Limpar stages antigos
        })
        .eq('id', agent.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avivar-agent-routing'] });
      updateStep({ stepId: 'ai_routing_configured', completed: true });
      toast.success('Roteamento salvo!');
    },
    onError: (error: any) => {
      toast.error('Erro ao salvar: ' + error.message);
    }
  });

  const toggleKanban = (kanbanId: string) => {
    setSelectedKanbans(prev => 
      prev.includes(kanbanId) 
        ? prev.filter(k => k !== kanbanId)
        : [...prev, kanbanId]
    );
  };

  const handleSave = () => {
    saveRouting.mutate();
  };

  const isLoading = loadingAgent || loadingKanbans;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--avivar-primary))]" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Configure um agente de IA primeiro.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status */}
      <div className={cn(
        "p-4 rounded-xl border",
        hasRouting
          ? "bg-green-500/10 border-green-500/30" 
          : "bg-amber-500/10 border-amber-500/30"
      )}>
        <div className="flex items-center gap-3">
          {hasRouting ? (
            <CheckCircle2 className="h-6 w-6 text-green-600" />
          ) : (
            <Route className="h-6 w-6 text-amber-600" />
          )}
          <div>
            <p className="font-medium">
              {hasRouting ? 'Roteamento configurado!' : 'Configure o roteamento'}
            </p>
            <p className="text-sm text-muted-foreground">
              {hasRouting 
                ? `${selectedKanbans.length} funil(s) selecionado(s)`
                : 'Defina em quais funis a IA vai atuar'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 rounded-xl bg-[hsl(var(--avivar-primary)/0.1)] border border-[hsl(var(--avivar-primary)/0.2)]">
        <p className="text-sm">
          <strong>Como funciona:</strong> A IA usará as instruções de cada coluna do funil selecionado para saber como atender o lead em cada etapa.
        </p>
      </div>

      {/* Seleção de Kanbans */}
      <div className="space-y-3">
        <h4 className="font-medium text-[hsl(var(--avivar-foreground))]">
          Selecione os funis onde <strong>{agent.name}</strong> vai atuar:
        </h4>
        
        <div className="grid gap-3">
          {kanbans?.map((kanban) => (
            <Card 
              key={kanban.id}
              className={cn(
                "p-4 cursor-pointer transition-all",
                selectedKanbans.includes(kanban.id)
                  ? "bg-[hsl(var(--avivar-primary)/0.1)] border-[hsl(var(--avivar-primary))]"
                  : "bg-[hsl(var(--avivar-secondary))] border-[hsl(var(--avivar-border))] hover:border-[hsl(var(--avivar-primary)/0.5)]"
              )}
              onClick={() => toggleKanban(kanban.id)}
            >
              <div className="flex items-center gap-3">
                <Checkbox 
                  checked={selectedKanbans.includes(kanban.id)}
                  onCheckedChange={() => toggleKanban(kanban.id)}
                  className="data-[state=checked]:bg-[hsl(var(--avivar-primary))] data-[state=checked]:border-[hsl(var(--avivar-primary))]"
                />
                <div>
                  <p className="font-medium">{kanban.name}</p>
                </div>
                {selectedKanbans.includes(kanban.id) && (
                  <Badge className="ml-auto bg-[hsl(var(--avivar-primary)/0.2)] text-[hsl(var(--avivar-primary))]">
                    Ativo
                  </Badge>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Ações */}
      <div className="flex gap-3 justify-end">
        <Button
          variant="outline"
          onClick={() => {
            updateStep({ stepId: 'ai_routing_configured', completed: true });
            onComplete();
          }}
        >
          Pular
        </Button>
        <Button
          onClick={handleSave}
          disabled={!hasRouting || saveRouting.isPending}
          className="gap-2 bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-accent))]"
        >
          {saveRouting.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowRight className="h-4 w-4" />
          )}
          Salvar e Continuar
        </Button>
      </div>
    </div>
  );
}
