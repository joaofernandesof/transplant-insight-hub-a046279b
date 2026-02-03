/**
 * Dialog para configurar checklists de bloqueio por coluna
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ListChecks, Plus, Trash2, Loader2, Info } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { KanbanColumnData } from '../AvivarKanbanPage';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columns: KanbanColumnData[];
  preSelectedColumnId?: string;
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

export function ColumnChecklistDialog({ open, onOpenChange, columns, preSelectedColumnId }: Props) {
  const queryClient = useQueryClient();
  const [selectedColumn, setSelectedColumn] = useState<string>(preSelectedColumnId || '');
  const [newField, setNewField] = useState<ChecklistField>({
    field_key: '',
    field_label: '',
    field_type: 'text',
    is_required: true
  });

  // Update selected column when preSelectedColumnId changes
  useEffect(() => {
    if (preSelectedColumnId) {
      setSelectedColumn(preSelectedColumnId);
    }
  }, [preSelectedColumnId, open]);

  // Buscar checklists existentes
  const { data: checklists, isLoading, refetch } = useQuery({
    queryKey: ['avivar-column-checklists', selectedColumn],
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
      toast.success('Campo adicionado ao checklist!');
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
      toast.success('Preset aplicado!');
    } else {
      toast.info('Nenhum preset encontrado para esta coluna');
    }
  };

  const handleAddField = () => {
    if (!newField.field_key || !newField.field_label) {
      toast.error('Preencha a chave e o rótulo do campo');
      return;
    }
    addField.mutate(newField);
  };

  const selectedColumnData = columns.find(c => c.id === selectedColumn);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))] max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[hsl(var(--avivar-foreground))] flex items-center gap-2">
            <ListChecks className="h-5 w-5 text-[hsl(var(--avivar-primary))]" />
            Checklists de Bloqueio
          </DialogTitle>
          <DialogDescription className="text-[hsl(var(--avivar-muted-foreground))]">
            Configure campos obrigatórios que devem ser preenchidos antes de mover o lead para outra coluna.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Info */}
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex gap-2">
            <Info className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 dark:text-amber-400">
              <strong>Regra:</strong> Se um campo obrigatório não estiver preenchido no lead, ele não poderá ser movido (nem manualmente, nem pela IA).
            </p>
          </div>

          {/* Seletor de Coluna */}
          <div className="space-y-2">
            <Label className="text-[hsl(var(--avivar-foreground))]">Selecione uma coluna</Label>
            <Select value={selectedColumn} onValueChange={setSelectedColumn}>
              <SelectTrigger className="bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))]">
                <SelectValue placeholder="Escolha uma coluna..." />
              </SelectTrigger>
              <SelectContent>
                {columns.map((col) => (
                  <SelectItem key={col.id} value={col.id}>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded bg-gradient-to-r ${col.color}`} />
                      {col.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Checklists da coluna selecionada */}
          {selectedColumn && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm text-[hsl(var(--avivar-foreground))]">
                  Campos para "{selectedColumnData?.name}"
                </h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => usePreset(selectedColumnData?.name || '')}
                  className="text-xs border-[hsl(var(--avivar-border))]"
                >
                  Usar Preset
                </Button>
              </div>

              {/* Lista de campos existentes */}
              {isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-[hsl(var(--avivar-primary))]" />
                </div>
              ) : checklists && checklists.length > 0 ? (
                <div className="space-y-2">
                  {checklists.map((field) => (
                    <Card key={field.id} className="p-3 bg-[hsl(var(--avivar-secondary))] border-[hsl(var(--avivar-border))] flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm text-[hsl(var(--avivar-foreground))]">{field.field_label}</p>
                        <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
                          Tipo: {FIELD_TYPES.find(t => t.value === field.field_type)?.label} • 
                          {field.is_required ? ' Obrigatório' : ' Opcional'}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeField.mutate(field.id)}
                        disabled={removeField.isPending}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[hsl(var(--avivar-muted-foreground))] text-center py-4">
                  Nenhum campo configurado. Adicione campos abaixo.
                </p>
              )}

              {/* Adicionar novo campo */}
              <Card className="p-4 bg-[hsl(var(--avivar-background))] border-dashed border-[hsl(var(--avivar-border))] space-y-3">
                <h5 className="text-sm font-medium text-[hsl(var(--avivar-foreground))]">Adicionar Campo</h5>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Chave (sem espaços)</Label>
                    <Input
                      placeholder="ex: scheduled_date"
                      value={newField.field_key}
                      onChange={(e) => setNewField({ ...newField, field_key: e.target.value.replace(/\s/g, '_').toLowerCase() })}
                      className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Rótulo</Label>
                    <Input
                      placeholder="ex: Data do Agendamento"
                      value={newField.field_label}
                      onChange={(e) => setNewField({ ...newField, field_label: e.target.value })}
                      className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]"
                    />
                  </div>
                </div>
                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <Label className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Tipo</Label>
                    <Select 
                      value={newField.field_type} 
                      onValueChange={(v) => setNewField({ ...newField, field_type: v })}
                    >
                      <SelectTrigger className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
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
                    <Label className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Obrigatório</Label>
                  </div>
                  <Button
                    onClick={handleAddField}
                    disabled={addField.isPending}
                    size="sm"
                    className="gap-1 bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-accent))]"
                  >
                    {addField.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
