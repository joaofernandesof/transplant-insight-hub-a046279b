/**
 * Dialog para configurar campos do checklist de uma coluna
 * Permite adicionar, editar e remover campos personalizados
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Settings2, Plus, Trash2, Loader2, GripVertical, Pencil, X, Check } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { KanbanColumnSelector } from './KanbanColumnSelector';

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
  required_for_columns?: string[];
  options?: string[];
}

// Todos os tipos de campo disponíveis
const FIELD_TYPES = [
  { value: 'text', label: 'Texto curto' },
  { value: 'number', label: 'Numérico' },
  { value: 'boolean', label: 'Interruptor' },
  { value: 'select', label: 'Selecionar' },
  { value: 'multiselect', label: 'Seleção múltipla' },
  { value: 'date', label: 'Data' },
  { value: 'textarea', label: 'Texto longo' },
  { value: 'address', label: 'Endereço' },
  { value: 'datetime', label: 'Data e hora' },
  { value: 'file', label: 'Arquivo' },
];

export function ChecklistConfigDialog({ open, onOpenChange, columnId, columnName }: Props) {
  const queryClient = useQueryClient();
  const [newField, setNewField] = useState<ChecklistField>({
    field_key: '',
    field_label: '',
    field_type: 'text',
    is_required: false,
    required_for_columns: [],
    options: []
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editField, setEditField] = useState<ChecklistField>({
    field_key: '',
    field_label: '',
    field_type: 'text',
    is_required: false,
    required_for_columns: [],
    options: []
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
          field_key: field.field_key,
          field_label: field.field_label,
          field_type: field.field_type,
          is_required: field.is_required,
          required_for_columns: field.is_required ? field.required_for_columns : null,
          options: (field.field_type === 'select' || field.field_type === 'multiselect') ? field.options : null,
          order_index: (checklists?.length || 0)
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ['lead-checklist-fields'] });
      setNewField({ field_key: '', field_label: '', field_type: 'text', is_required: false, required_for_columns: [], options: [] });
      toast.success('Campo adicionado!');
    },
    onError: (error: Error) => {
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

  // Atualizar campo
  const updateField = useMutation({
    mutationFn: async ({ fieldId, data }: { fieldId: string; data: Partial<ChecklistField> }) => {
      const { error } = await supabase
        .from('avivar_column_checklists')
        .update({
          field_label: data.field_label,
          field_key: data.field_key,
          field_type: data.field_type,
          is_required: data.is_required,
          required_for_columns: data.is_required ? data.required_for_columns : null,
          options: (data.field_type === 'select' || data.field_type === 'multiselect') ? data.options : null
        })
        .eq('id', fieldId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ['lead-checklist-fields'] });
      setEditingId(null);
      toast.success('Campo atualizado!');
    },
    onError: (error: Error) => {
      toast.error('Erro: ' + error.message);
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

  const handleEditLabelChange = (label: string) => {
    setEditField({ 
      ...editField, 
      field_label: label,
      field_key: label.replace(/\s/g, '_').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    });
  };

  const startEdit = (field: Record<string, unknown>) => {
    setEditingId(field.id as string);
    const fieldOptions = field.options as string[] | null;
    setEditField({
      field_key: field.field_key as string,
      field_label: field.field_label as string,
      field_type: field.field_type as string,
      is_required: (field.is_required as boolean) ?? false,
      required_for_columns: (field.required_for_columns as string[]) || [],
      options: fieldOptions || []
    });
  };

  const saveEdit = () => {
    if (!editField.field_label || !editingId) return;
    updateField.mutate({ fieldId: editingId, data: editField });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  // Helpers para gerenciar opções
  const addOption = (isEdit: boolean) => {
    if (isEdit) {
      setEditField({ ...editField, options: [...(editField.options || []), ''] });
    } else {
      setNewField({ ...newField, options: [...(newField.options || []), ''] });
    }
  };

  const updateOption = (index: number, value: string, isEdit: boolean) => {
    if (isEdit) {
      const newOptions = [...(editField.options || [])];
      newOptions[index] = value;
      setEditField({ ...editField, options: newOptions });
    } else {
      const newOptions = [...(newField.options || [])];
      newOptions[index] = value;
      setNewField({ ...newField, options: newOptions });
    }
  };

  const removeOption = (index: number, isEdit: boolean) => {
    if (isEdit) {
      const newOptions = (editField.options || []).filter((_, i) => i !== index);
      setEditField({ ...editField, options: newOptions });
    } else {
      const newOptions = (newField.options || []).filter((_, i) => i !== index);
      setNewField({ ...newField, options: newOptions });
    }
  };

  const handleTypeChange = (type: string, isEdit: boolean) => {
    if (isEdit) {
      const needsOptions = type === 'select' || type === 'multiselect';
      setEditField({ 
        ...editField, 
        field_type: type,
        options: needsOptions && (!editField.options || editField.options.length === 0) ? [''] : editField.options
      });
    } else {
      const needsOptions = type === 'select' || type === 'multiselect';
      setNewField({ 
        ...newField, 
        field_type: type,
        options: needsOptions && (!newField.options || newField.options.length === 0) ? [''] : newField.options
      });
    }
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
                    className="p-3 bg-[hsl(var(--avivar-muted)/0.3)] border-[hsl(var(--avivar-border))]"
                  >
                    {editingId === field.id ? (
                      // Modo edição
                      <div className="space-y-3">
                        <div>
                          <Label className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Nome do campo</Label>
                          <Input
                            value={editField.field_label}
                            onChange={(e) => handleEditLabelChange(e.target.value)}
                            className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Tipo</Label>
                            <Select 
                              value={editField.field_type} 
                              onValueChange={(v) => handleTypeChange(v, true)}
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
                                checked={editField.is_required}
                                onCheckedChange={(v) => setEditField({ ...editField, is_required: v, required_for_columns: v ? editField.required_for_columns : [] })}
                              />
                              <Label className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Obrigatório</Label>
                            </div>
                          </div>
                        </div>

                        {/* Editor de opções para select/multiselect */}
                        {(editField.field_type === 'select' || editField.field_type === 'multiselect') && (
                          <div className="space-y-2">
                            <Label className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Opções</Label>
                            <div className="space-y-2">
                              {(editField.options || []).map((option, index) => (
                                <div key={index} className="flex items-center gap-2">
                                  <Input
                                    value={option}
                                    onChange={(e) => updateOption(index, e.target.value, true)}
                                    placeholder="Opção"
                                    className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))] flex-1"
                                  />
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeOption(index, true)}
                                    className="h-8 w-8 shrink-0 text-destructive hover:text-destructive/80"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                            <button
                              type="button"
                              onClick={() => addOption(true)}
                              className="text-sm text-[hsl(var(--avivar-primary))] hover:underline"
                            >
                              Adicionar opção
                            </button>
                          </div>
                        )}

                        {/* Seletor de Kanbans/Colunas quando obrigatório */}
                        {editField.is_required && (
                          <div className="space-y-2">
                            <Label className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
                              Selecione as colunas onde este campo é obrigatório para mover o lead:
                            </Label>
                            <KanbanColumnSelector
                              selectedColumnIds={editField.required_for_columns || []}
                              onSelectionChange={(columnIds) => setEditField({ ...editField, required_for_columns: columnIds })}
                            />
                          </div>
                        )}

                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={cancelEdit}
                            className="text-[hsl(var(--avivar-muted-foreground))]"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Cancelar
                          </Button>
                          <Button
                            size="sm"
                            onClick={saveEdit}
                            disabled={updateField.isPending || !editField.field_label}
                            className="bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-primary)/0.9)]"
                          >
                            {updateField.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-1" />
                            ) : (
                              <Check className="h-4 w-4 mr-1" />
                            )}
                            Salvar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // Modo visualização
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <GripVertical className="h-4 w-4 text-[hsl(var(--avivar-muted-foreground))] shrink-0 cursor-grab" />
                          <div className="min-w-0">
                            <p className="font-medium text-sm text-[hsl(var(--avivar-foreground))] truncate">
                              {field.field_label}
                            </p>
                            <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
                              {FIELD_TYPES.find(t => t.value === field.field_type)?.label || field.field_type}
                              {field.is_required && ' • Obrigatório'}
                              {field.required_for_columns && (field.required_for_columns as string[]).length > 0 && (
                                <span className="text-[hsl(var(--avivar-primary))]">
                                  {' '}• {(field.required_for_columns as string[]).length} colunas
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => startEdit(field)}
                            className="h-8 w-8 shrink-0 text-[hsl(var(--avivar-muted-foreground))] hover:text-[hsl(var(--avivar-primary))]"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeField.mutate(field.id)}
                            disabled={removeField.isPending}
                            className="h-8 w-8 shrink-0 text-[hsl(var(--avivar-muted-foreground))] hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
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
                    onValueChange={(v) => handleTypeChange(v, false)}
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
                      onCheckedChange={(v) => setNewField({ ...newField, is_required: v, required_for_columns: v ? newField.required_for_columns : [] })}
                    />
                    <Label className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Obrigatório</Label>
                  </div>
                </div>
              </div>

              {/* Editor de opções para select/multiselect */}
              {(newField.field_type === 'select' || newField.field_type === 'multiselect') && (
                <div className="space-y-2">
                  <Label className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Opções</Label>
                  <div className="space-y-2">
                    {(newField.options || []).map((option, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          value={option}
                          onChange={(e) => updateOption(index, e.target.value, false)}
                          placeholder="Opção"
                          className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))] flex-1"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeOption(index, false)}
                          className="h-8 w-8 shrink-0 text-destructive hover:text-destructive/80"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => addOption(false)}
                    className="text-sm text-[hsl(var(--avivar-primary))] hover:underline"
                  >
                    Adicionar opção
                  </button>
                </div>
              )}

              {/* Seletor de Kanbans/Colunas quando obrigatório */}
              {newField.is_required && (
                <div className="space-y-2">
                  <Label className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
                    Selecione as colunas onde este campo é obrigatório para mover o lead:
                  </Label>
                  <KanbanColumnSelector
                    selectedColumnIds={newField.required_for_columns || []}
                    onSelectionChange={(columnIds) => setNewField({ ...newField, required_for_columns: columnIds })}
                  />
                </div>
              )}

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
