/**
 * Step 7: Checklists de Bloqueio por Coluna
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { CheckCircle2, ListChecks, ArrowRight, Loader2, Plus, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAvivarOnboarding } from '../../hooks/useAvivarOnboarding';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Props {
  onComplete: () => void;
}

interface ChecklistField {
  field_key: string;
  field_label: string;
  field_type: string;
  is_required: boolean;
}

const FIELD_TYPES = [
  { value: 'text', label: 'Texto' },
  { value: 'date', label: 'Data' },
  { value: 'datetime', label: 'Data e Hora' },
  { value: 'boolean', label: 'Sim/Não' },
  { value: 'select', label: 'Seleção' }
];

const PRESET_FIELDS: Record<string, ChecklistField[]> = {
  'agendado': [
    { field_key: 'scheduled_date', field_label: 'Data do Agendamento', field_type: 'date', is_required: true },
    { field_key: 'scheduled_time', field_label: 'Horário', field_type: 'text', is_required: true },
    { field_key: 'professional', field_label: 'Profissional', field_type: 'text', is_required: true },
    { field_key: 'appointment_type', field_label: 'Tipo de Atendimento', field_type: 'text', is_required: true }
  ],
  'contrato': [
    { field_key: 'contract_value', field_label: 'Valor do Contrato', field_type: 'text', is_required: true },
    { field_key: 'payment_method', field_label: 'Forma de Pagamento', field_type: 'text', is_required: true }
  ],
  'procedimento': [
    { field_key: 'procedure_date', field_label: 'Data do Procedimento', field_type: 'date', is_required: true },
    { field_key: 'procedure_done', field_label: 'Procedimento Realizado', field_type: 'boolean', is_required: true }
  ]
};

export function OnboardingStepChecklists({ onComplete }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { updateStep, onboardingStatus } = useAvivarOnboarding();
  const [selectedColumn, setSelectedColumn] = useState<string>('');
  const [newField, setNewField] = useState<ChecklistField>({
    field_key: '',
    field_label: '',
    field_type: 'text',
    is_required: true
  });

  // Buscar colunas
  const { data: columns, isLoading: loadingColumns } = useQuery({
    queryKey: ['avivar-columns-checklists', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data: kanbans } = await supabase
        .from('avivar_kanbans')
        .select('id')
        .eq('user_id', user.id);
      
      if (!kanbans) return [];

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

  // Buscar checklists existentes
  const { data: checklists, isLoading: loadingChecklists, refetch } = useQuery({
    queryKey: ['avivar-checklists', selectedColumn],
    queryFn: async () => {
      if (!selectedColumn) return [];
      const { data, error } = await supabase
        .from('avivar_column_checklists')
        .select('*')
        .eq('column_id', selectedColumn)
        .order('order_index');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedColumn
  });

  const hasChecklists = checklists && checklists.length > 0;
  const isStepComplete = onboardingStatus?.steps.column_checklists_setup ?? false;

  // Adicionar campo
  const addField = useMutation({
    mutationFn: async (field: ChecklistField) => {
      const { error } = await supabase
        .from('avivar_column_checklists')
        .insert({
          column_id: selectedColumn,
          ...field,
          order_index: (checklists?.length || 0)
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      refetch();
      setNewField({ field_key: '', field_label: '', field_type: 'text', is_required: true });
      toast.success('Campo adicionado!');
      
      if (!isStepComplete) {
        updateStep({ stepId: 'column_checklists_setup', completed: true });
      }
    },
    onError: (error: any) => {
      toast.error('Erro: ' + error.message);
    }
  });

  // Remover campo
  const removeField = useMutation({
    mutationFn: async (fieldId: string) => {
      const { error } = await supabase
        .from('avivar_column_checklists')
        .delete()
        .eq('id', fieldId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      refetch();
      toast.success('Campo removido!');
    }
  });

  // Usar preset
  const usePreset = async (columnName: string) => {
    const key = Object.keys(PRESET_FIELDS).find(k => 
      columnName.toLowerCase().includes(k.toLowerCase())
    );
    
    if (key && PRESET_FIELDS[key]) {
      for (const field of PRESET_FIELDS[key]) {
        await addField.mutateAsync(field);
      }
    }
  };

  const handleAddField = () => {
    if (!newField.field_key || !newField.field_label) {
      toast.error('Preencha todos os campos');
      return;
    }
    addField.mutate(newField);
  };

  const isLoading = loadingColumns || loadingChecklists;

  return (
    <div className="space-y-6">
      {/* Status */}
      <div className={cn(
        "p-4 rounded-xl border",
        isStepComplete
          ? "bg-green-500/10 border-green-500/30" 
          : "bg-amber-500/10 border-amber-500/30"
      )}>
        <div className="flex items-center gap-3">
          {isStepComplete ? (
            <CheckCircle2 className="h-6 w-6 text-green-600" />
          ) : (
            <ListChecks className="h-6 w-6 text-amber-600" />
          )}
          <div>
            <p className="font-medium">
              {isStepComplete ? 'Checklists configurados!' : 'Configure os checklists'}
            </p>
            <p className="text-sm text-muted-foreground">
              Defina campos obrigatórios para cada etapa do funil
            </p>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 rounded-xl bg-[hsl(var(--avivar-primary)/0.1)] border border-[hsl(var(--avivar-primary)/0.2)]">
        <p className="text-sm">
          <strong>Regra de Bloqueio:</strong> Se um campo obrigatório não estiver preenchido, o lead não pode ser movido para a próxima etapa (nem manualmente, nem pela IA).
        </p>
      </div>

      {/* Seletor de Coluna */}
      <div className="space-y-2">
        <Label>Selecione uma coluna para configurar</Label>
        <Select value={selectedColumn} onValueChange={setSelectedColumn}>
          <SelectTrigger>
            <SelectValue placeholder="Escolha uma coluna..." />
          </SelectTrigger>
          <SelectContent>
            {columns?.map((col) => (
              <SelectItem key={col.id} value={col.id}>
                {col.name} ({col.kanban?.name})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Checklists da coluna selecionada */}
      {selectedColumn && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Campos Obrigatórios</h4>
            {columns?.find(c => c.id === selectedColumn) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => usePreset(columns.find(c => c.id === selectedColumn)?.name || '')}
                className="text-xs"
              >
                Usar Preset
              </Button>
            )}
          </div>

          {/* Lista de campos existentes */}
          <div className="space-y-2">
            {checklists?.map((field) => (
              <Card key={field.id} className="p-3 bg-[hsl(var(--avivar-secondary))] flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{field.field_label}</p>
                  <p className="text-xs text-muted-foreground">
                    Tipo: {FIELD_TYPES.find(t => t.value === field.field_type)?.label} • 
                    {field.is_required ? ' Obrigatório' : ' Opcional'}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeField.mutate(field.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </Card>
            ))}
          </div>

          {/* Adicionar novo campo */}
          <Card className="p-4 bg-[hsl(var(--avivar-card))] border-dashed space-y-3">
            <h5 className="text-sm font-medium">Adicionar Campo</h5>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Chave (sem espaços)</Label>
                <Input
                  placeholder="ex: scheduled_date"
                  value={newField.field_key}
                  onChange={(e) => setNewField({ ...newField, field_key: e.target.value.replace(/\s/g, '_').toLowerCase() })}
                />
              </div>
              <div>
                <Label className="text-xs">Rótulo</Label>
                <Input
                  placeholder="ex: Data do Agendamento"
                  value={newField.field_label}
                  onChange={(e) => setNewField({ ...newField, field_label: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <Label className="text-xs">Tipo</Label>
                <Select 
                  value={newField.field_type} 
                  onValueChange={(v) => setNewField({ ...newField, field_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FIELD_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={newField.is_required}
                  onCheckedChange={(v) => setNewField({ ...newField, is_required: v })}
                />
                <Label className="text-xs">Obrigatório</Label>
              </div>
              <Button
                onClick={handleAddField}
                disabled={addField.isPending}
                className="gap-1 bg-[hsl(var(--avivar-primary))]"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Ações */}
      <div className="flex gap-3 justify-end">
        <Button
          variant="outline"
          onClick={() => {
            updateStep({ stepId: 'column_checklists_setup', completed: true });
            onComplete();
          }}
        >
          Pular
        </Button>
        <Button
          onClick={() => {
            if (!isStepComplete) {
              updateStep({ stepId: 'column_checklists_setup', completed: true });
            }
            onComplete();
          }}
          className="gap-2 bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-accent))]"
        >
          Continuar
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
