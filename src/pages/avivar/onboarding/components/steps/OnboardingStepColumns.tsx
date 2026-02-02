/**
 * Step 3: Configurar Colunas com Instruções
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle2, Columns, ArrowRight, Loader2, Save, Edit2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAvivarOnboarding } from '../../hooks/useAvivarOnboarding';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Props {
  onComplete: () => void;
}

// Templates de instrução por tipo de coluna
const INSTRUCTION_TEMPLATES: Record<string, string> = {
  'lead': 'Qualifique o lead identificando interesse e necessidade. Pergunte sobre o problema que quer resolver.',
  'triagem': 'Valide a dor principal do lead e confirme área desejada. Alinhe expectativas iniciais.',
  'tentando agendar': 'Ofereça 2 opções de data/horário usando técnica Ou/Ou. Crie senso de urgência.',
  'reagendamento': 'Entenda motivo do reagendamento com empatia. Ofereça novas opções imediatamente.',
  'agendado': 'Confirme data, horário e local. Envie lembrete 24h antes. Reforce valor da consulta.',
  'follow up': 'Retome contato após consulta. Tire dúvidas e apresente próximos passos.',
  'cliente': 'Conduza para fechamento. Apresente formas de pagamento e próximos passos do processo.',
  'onboarding': 'Dê boas-vindas ao novo paciente. Envie orientações iniciais e canal de suporte.',
  'contrato': 'Envie contrato e esclareça dúvidas. Acompanhe assinatura e pagamento.',
  'pré-operatório': 'Solicite exames necessários. Envie orientações pré-operatórias detalhadas.',
  'procedimento': 'Registre realização do procedimento. Faça registro fotográfico e orientações de alta.',
  'pós-operatório': 'Faça contato no mesmo dia e dia seguinte. Registre dúvidas e intercorrências.',
  'relacionamento': 'Solicite avaliação e depoimento. Apresente programa de indicações.',
  'desqualificados': 'Registre motivo de desqualificação para análise futura.'
};

export function OnboardingStepColumns({ onComplete }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { updateStep, onboardingStatus } = useAvivarOnboarding();
  const [editingColumn, setEditingColumn] = useState<string | null>(null);
  const [instructionText, setInstructionText] = useState('');

  // Buscar colunas de todos os funis
  const { data: columns, isLoading, refetch } = useQuery({
    queryKey: ['avivar-columns-onboarding', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // Primeiro buscar os kanbans do usuário
      const { data: kanbans } = await supabase
        .from('avivar_kanbans')
        .select('id, name')
        .eq('user_id', user.id);
      
      if (!kanbans || kanbans.length === 0) return [];

      // Buscar colunas de cada kanban
      const { data, error } = await supabase
        .from('avivar_kanban_columns')
        .select('*, kanban:avivar_kanbans(name)')
        .in('kanban_id', kanbans.map(k => k.id))
        .order('order_index');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id
  });

  const columnsWithInstructions = columns?.filter(c => c.ai_instruction && c.ai_instruction.trim() !== '') || [];
  const isComplete = columnsWithInstructions.length >= 2;
  const isStepComplete = onboardingStatus?.steps.columns_setup ?? false;

  // Mutation para atualizar instrução
  const updateInstruction = useMutation({
    mutationFn: async ({ columnId, instruction }: { columnId: string; instruction: string }) => {
      const { error } = await supabase
        .from('avivar_kanban_columns')
        .update({ ai_instruction: instruction })
        .eq('id', columnId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avivar-columns-onboarding'] });
      setEditingColumn(null);
      toast.success('Instrução salva!');
      
      // Verificar se completou
      setTimeout(() => {
        refetch().then(() => {
          if (columnsWithInstructions.length + 1 >= 2 && !isStepComplete) {
            updateStep({ stepId: 'columns_setup', completed: true });
          }
        });
      }, 500);
    },
    onError: (error: any) => {
      toast.error('Erro ao salvar: ' + error.message);
    }
  });

  const handleEdit = (column: any) => {
    setEditingColumn(column.id);
    setInstructionText(column.ai_instruction || '');
  };

  const handleSave = () => {
    if (!editingColumn) return;
    updateInstruction.mutate({ columnId: editingColumn, instruction: instructionText });
  };

  const handleUseTemplate = (columnName: string) => {
    const key = Object.keys(INSTRUCTION_TEMPLATES).find(k => 
      columnName.toLowerCase().includes(k.toLowerCase())
    );
    if (key) {
      setInstructionText(INSTRUCTION_TEMPLATES[key]);
    }
  };

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
            <Columns className="h-6 w-6 text-amber-600" />
          )}
          <div>
            <p className="font-medium">
              {isComplete ? 'Colunas configuradas!' : 'Configure instruções nas colunas'}
            </p>
            <p className="text-sm text-muted-foreground">
              {columnsWithInstructions.length} de {columns?.length} colunas com instrução
            </p>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 rounded-xl bg-[hsl(var(--avivar-primary)/0.1)] border border-[hsl(var(--avivar-primary)/0.2)]">
        <p className="text-sm">
          <strong>Importante:</strong> As instruções de coluna são usadas pela IA para saber como atender o lead em cada etapa.
          Configure pelo menos 2 colunas para continuar.
        </p>
      </div>

      {/* Lista de colunas */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
        {columns?.map((column) => (
          <Card 
            key={column.id}
            className={cn(
              "p-4 border transition-all",
              editingColumn === column.id 
                ? "bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-primary))]" 
                : "bg-[hsl(var(--avivar-secondary))] border-[hsl(var(--avivar-border))]"
            )}
          >
            {editingColumn === column.id ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{column.name}</p>
                    <p className="text-xs text-muted-foreground">{column.kanban?.name}</p>
                  </div>
                  <Badge variant="outline">Editando</Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Instrução para a IA</Label>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleUseTemplate(column.name)}
                      className="text-xs h-7"
                    >
                      Usar template
                    </Button>
                  </div>
                  <Textarea
                    value={instructionText}
                    onChange={(e) => setInstructionText(e.target.value)}
                    placeholder="Descreva como a IA deve atender leads nesta etapa..."
                    rows={3}
                    className="resize-none"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleSave}
                    disabled={updateInstruction.isPending}
                    className="gap-2 bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-accent))]"
                  >
                    {updateInstruction.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Salvar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setEditingColumn(null)}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium">{column.name}</p>
                    <Badge variant="outline" className="text-xs">{column.kanban?.name}</Badge>
                  </div>
                  {column.ai_instruction ? (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {column.ai_instruction}
                    </p>
                  ) : (
                    <p className="text-sm text-amber-600 italic">
                      Sem instrução configurada
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {column.ai_instruction && (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(column)}
                    className="gap-1"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Ações */}
      {isComplete && (
        <div className="flex justify-end">
          <Button
            onClick={() => {
              updateStep({ stepId: 'columns_setup', completed: true });
              onComplete();
            }}
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
