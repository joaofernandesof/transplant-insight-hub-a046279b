/**
 * Step 2: Configurar Funis
 */

import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { CheckCircle2, Kanban, ArrowRight, Loader2, Plus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAvivarOnboarding } from '../../hooks/useAvivarOnboarding';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Props {
  onComplete: () => void;
}

export function OnboardingStepFunnels({ onComplete }: Props) {
  const { user } = useAuth();
  const { updateStep, onboardingStatus } = useAvivarOnboarding();

  // Buscar funis existentes
  const { data: kanbans, isLoading, refetch } = useQuery({
    queryKey: ['avivar-kanbans-onboarding', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('avivar_kanbans')
        .select('*')
        .eq('user_id', user.id)
        .order('order_index');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id
  });

  const hasCommercial = kanbans?.some(k => k.name.toLowerCase().includes('comercial'));
  const hasPostSale = kanbans?.some(k => k.name.toLowerCase().includes('pós-venda') || k.name.toLowerCase().includes('pos-venda'));
  const isComplete = kanbans && kanbans.length >= 2 && hasCommercial && hasPostSale;
  const isStepComplete = onboardingStatus?.steps.funnels_setup ?? false;

  // Criar funis padrão
  const createDefaultFunnels = async () => {
    if (!user?.id) return;

    try {
      // Usar RPC que já existe
      const { error } = await supabase.rpc('create_default_avivar_kanbans', {
        p_user_id: user.id
      });

      if (error) throw error;
      
      toast.success('Funis criados com sucesso!');
      await refetch();
      updateStep({ stepId: 'funnels_setup', completed: true });
    } catch (error: any) {
      toast.error('Erro ao criar funis: ' + error.message);
    }
  };

  // Atualizar step quando funis existirem
  useEffect(() => {
    if (isComplete && !isStepComplete) {
      updateStep({ stepId: 'funnels_setup', completed: true });
    }
  }, [isComplete, isStepComplete]);

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
        isComplete
          ? "bg-green-500/10 border-green-500/30" 
          : "bg-amber-500/10 border-amber-500/30"
      )}>
        <div className="flex items-center gap-3">
          {isComplete ? (
            <CheckCircle2 className="h-6 w-6 text-green-600" />
          ) : (
            <Kanban className="h-6 w-6 text-amber-600" />
          )}
          <div>
            <p className="font-medium">
              {isComplete ? 'Funis configurados!' : 'Configure seus funis'}
            </p>
            <p className="text-sm text-muted-foreground">
              {isComplete 
                ? `${kanbans?.length} funis ativos`
                : 'Você precisa de pelo menos 2 funis: Comercial e Pós-Venda'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Lista de funis */}
      <div className="grid gap-3">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-[hsl(var(--avivar-foreground))]">Seus Funis</h4>
          {kanbans && kanbans.length === 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={createDefaultFunnels}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Criar Funis Padrão
            </Button>
          )}
        </div>

        {kanbans && kanbans.length > 0 ? (
          <div className="grid gap-2">
            {kanbans.map((kanban) => (
              <Card 
                key={kanban.id} 
                className="p-4 bg-[hsl(var(--avivar-secondary))] border-[hsl(var(--avivar-border))]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br",
                      kanban.color || "from-[hsl(var(--avivar-primary))] to-[hsl(var(--avivar-accent))]"
                    )}>
                      <Kanban className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">{kanban.name}</p>
                      <p className="text-sm text-muted-foreground">{kanban.description}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-green-600 border-green-500/30">
                    Ativo
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-6 text-center bg-[hsl(var(--avivar-secondary))] border-dashed">
            <p className="text-muted-foreground mb-4">Nenhum funil configurado</p>
            <Button
              onClick={createDefaultFunnels}
              className="gap-2 bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-accent))]"
            >
              <Plus className="h-4 w-4" />
              Criar Funis Padrão
            </Button>
          </Card>
        )}
      </div>

      {/* Ações */}
      {isComplete && (
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
