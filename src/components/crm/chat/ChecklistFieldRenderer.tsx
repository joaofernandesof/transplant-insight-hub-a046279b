/**
 * Renderiza um campo de checklist baseado no tipo
 * Suporta: text, number, boolean, select, date, url, textarea, etc.
 */

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback';

interface ChecklistField {
  id: string;
  field_key: string;
  field_label: string;
  field_type: string;
  is_required: boolean;
  value: string | boolean | null;
}

interface Props {
  field: ChecklistField;
  leadPhone?: string | null;
  columnId?: string | null;
  onUpdate?: () => void;
}

export function ChecklistFieldRenderer({ field, leadPhone, columnId, onUpdate }: Props) {
  const [localValue, setLocalValue] = useState<string>(
    typeof field.value === 'string' ? field.value : ''
  );

  // Update local value when field changes
  useEffect(() => {
    setLocalValue(typeof field.value === 'string' ? field.value : '');
  }, [field.value]);

  // Debounced save to database
  const debouncedSave = useDebouncedCallback(async (value: string) => {
    if (!leadPhone || !columnId) return;

    try {
      // Buscar o lead atual
      const { data: lead } = await supabase
        .from('avivar_kanban_leads')
        .select('id, custom_fields')
        .eq('phone', leadPhone)
        .eq('column_id', columnId)
        .maybeSingle();

      if (!lead) return;

      // Atualizar custom_fields
      const currentFields = (lead.custom_fields as Record<string, string | boolean | null>) || {};
      const updatedFields: Record<string, string | boolean | null> = {
        ...currentFields,
        [field.field_key]: value || null
      };

      await supabase
        .from('avivar_kanban_leads')
        .update({ custom_fields: updatedFields as unknown as Record<string, never> })
        .eq('id', lead.id);

      onUpdate?.();
    } catch (error) {
      console.error('Erro ao salvar campo:', error);
      toast.error('Erro ao salvar');
    }
  }, 500);

  const handleChange = (value: string) => {
    setLocalValue(value);
    debouncedSave(value);
  };

  // Renderização baseada no tipo
  switch (field.field_type) {
    case 'text':
    default:
      return (
        <div className="flex items-center gap-3">
          <Label className="text-xs text-[hsl(var(--avivar-muted-foreground))] uppercase tracking-wide whitespace-nowrap shrink-0">
            {field.field_label}
            {field.is_required && <span className="text-[hsl(var(--avivar-primary))] ml-0.5">*</span>}
          </Label>
          <Input
            value={localValue}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="..."
            className="h-6 text-sm bg-transparent border-0 border-b border-[hsl(var(--avivar-primary))] rounded-none px-0 focus-visible:ring-0 focus-visible:border-[hsl(var(--avivar-primary))] text-[hsl(var(--avivar-foreground))] placeholder:text-[hsl(var(--avivar-muted-foreground)/0.5)] flex-1"
          />
        </div>
      );
  }
}
