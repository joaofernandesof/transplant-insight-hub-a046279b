/**
 * Dialog para configurar campos do checklist de uma coluna
 * Permite adicionar, editar e remover campos personalizados
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Settings2, Plus, Trash2, Loader2, GripVertical } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columnId: string;
  columnName?: string;
}

interface ChecklistField {
  field_key: string;
  field_label: string;
  field_type: string;
  is_required: boolean;
}

// Todos os tipos de campo disponíveis baseados nas imagens do usuário
const FIELD_TYPES = [
  { value: 'text', label: 'Texto curto' },
  { value: 'number', label: 'Numérico' },
  { value: 'boolean', label: 'Interruptor' },
  { value: 'select', label: 'Selecionar' },
  { value: 'multiselect', label: 'Seleção múltipla' },
  { value: 'date', label: 'Data' },
  { value: 'url', label: 'Url' },
  { value: 'textarea', label: 'Texto longo' },
  { value: 'radio', label: 'Botão de opção' },
  { value: 'short_address', label: 'Endereço curto' },
  { value: 'address', label: 'Endereço' },
  { value: 'birthdate', label: 'Data de nascimento' },
  { value: 'cpf', label: 'CPF' },
  { value: 'datetime', label: 'Data e hora' },
  { value: 'file', label: 'Arquivo' },
];

export function ChecklistConfigDialog({ open, onOpenChange, columnId, columnName }: Props) {
  const queryClient = useQueryClient();
  const [newField, setNewField] = useState<ChecklistField>({
    field_key: '',
    field_label: '',
    field_type: 'text',
    is_required: false
  });

  // Buscar checklists existentes
  const { data: checklists, isLoading, refetch } = useQuery({
    queryKey: ['avivar-column-checklists', columnId],
    queryFn: async () => {
      if (!columnId) return [];
      const { data, error } = await supabase
        .from('avivar_column_checklists')
        .select('*')
        .eq('column_id', columnId)
        .order('order_index');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!columnId && open
  });

  // Adicionar campo
  const addField = useMutation({
    mutationFn: async (field: ChecklistField) => {
      const { error } = await supabase
        .from('avivar_column_checklists')
        .insert({
          column_id: columnId,
          ...field,
          order_index: (checklists?.length || 0)
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ['lead-checklist-fields'] });
      setNewField({ field_key: '', field_label: '', field_type: 'text', is_required: false });
      toast.success('Campo adicionado!');
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
      queryClient.invalidateQueries({ queryKey: ['lead-checklist-fields'] });
      toast.success('Campo removido!');
    }
  });

  const handleAddField = () => {
    if (!newField.field_label) {
      toast.error('Preencha o nome do campo');
      return;
    }
    
    // Auto-gerar field_key a partir do label
    const fieldKey = newField.field_key || newField.field_label.replace(/\s/g, '_').toLowerCase();
    
    addField.mutate({
      ...newField,
      field_key: fieldKey
    });
  };

  // Auto-gerar field_key quando o label muda
  const handleLabelChange = (label: string) => {
    setNewField({ 
      ...newField, 
      field_label: label,
      field_key: label.replace(/\s/g, '_').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))] max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-[hsl(var(--avivar-foreground))] flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-[hsl(var(--avivar-primary))]" />
            Configurar Checklist
            {columnName && (
              <span className="text-sm font-normal text-[hsl(var(--avivar-muted-foreground))]">
                — {columnName}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4 py-2">
            {/* Lista de campos existentes */}
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-[hsl(var(--avivar-primary))]" />
              </div>
            ) : checklists && checklists.length > 0 ? (
              <div className="space-y-2">
                {checklists.map((field) => (
                  <Card 
                    key={field.id} 
                    className="p-3 bg-[hsl(var(--avivar-muted)/0.3)] border-[hsl(var(--avivar-border))] flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <GripVertical className="h-4 w-4 text-[hsl(var(--avivar-muted-foreground))] shrink-0 cursor-grab" />
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-[hsl(var(--avivar-foreground))] truncate">
                          {field.field_label}
                        </p>
                        <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
                          {FIELD_TYPES.find(t => t.value === field.field_type)?.label || field.field_type}
                          {field.is_required && ' • Obrigatório'}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeField.mutate(field.id)}
                      disabled={removeField.isPending}
                      className="h-8 w-8 shrink-0 text-[hsl(var(--avivar-muted-foreground))] hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[hsl(var(--avivar-muted-foreground))] text-center py-6">
                Nenhum campo configurado
              </p>
            )}

            {/* Adicionar novo campo */}
            <Card className="p-4 bg-[hsl(var(--avivar-background))] border-dashed border-[hsl(var(--avivar-border))] space-y-3">
              <h5 className="text-sm font-medium text-[hsl(var(--avivar-foreground))]">Adicionar Campo</h5>
              
              <div>
                <Label className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Nome do campo</Label>
                <Input
                  placeholder="Ex: Nome do responsável"
                  value={newField.field_label}
                  onChange={(e) => handleLabelChange(e.target.value)}
                  className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Tipo do campo</Label>
                  <Select 
                    value={newField.field_type} 
                    onValueChange={(v) => setNewField({ ...newField, field_type: v })}
                  >
                    <SelectTrigger className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                      {FIELD_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-end">
                  <div className="flex items-center gap-2 pb-2">
                    <Switch
                      checked={newField.is_required}
                      onCheckedChange={(v) => setNewField({ ...newField, is_required: v })}
                    />
                    <Label className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Obrigatório</Label>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleAddField}
                disabled={addField.isPending || !newField.field_label}
                size="sm"
                className="w-full gap-2 bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-primary)/0.9)]"
              >
                {addField.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Adicionar Campo
              </Button>
            </Card>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
