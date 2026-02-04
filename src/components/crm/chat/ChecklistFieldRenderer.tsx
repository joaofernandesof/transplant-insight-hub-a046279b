/**
 * Renderiza um campo de checklist baseado no tipo
 * Suporta: text, number, boolean, select, date, url, textarea, etc.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  const [isSaving, setIsSaving] = useState(false);
  const isEditingRef = useRef(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const lastSavedValueRef = useRef<string>(localValue);

  // Only sync from props when NOT actively editing
  useEffect(() => {
    if (!isEditingRef.current) {
      const newValue = typeof field.value === 'string' ? field.value : '';
      setLocalValue(newValue);
      lastSavedValueRef.current = newValue;
    }
  }, [field.value]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const saveToDatabase = useCallback(async (value: string) => {
    if (!leadPhone || !columnId) return;
    if (value === lastSavedValueRef.current) return; // Skip if value unchanged

    setIsSaving(true);
    try {
      // Buscar o lead atual
      const { data: lead, error: fetchError } = await supabase
        .from('avivar_kanban_leads')
        .select('id, custom_fields')
        .eq('phone', leadPhone)
        .eq('column_id', columnId)
        .maybeSingle();

      if (fetchError) throw fetchError;
      if (!lead) return;

      // Atualizar custom_fields
      const currentFields = (lead.custom_fields as Record<string, string | boolean | null>) || {};
      const updatedFields: Record<string, string | boolean | null> = {
        ...currentFields,
        [field.field_key]: value || null
      };

      const { error: updateError } = await supabase
        .from('avivar_kanban_leads')
        .update({ custom_fields: updatedFields as unknown as Record<string, never> })
        .eq('id', lead.id);

      if (updateError) throw updateError;

      lastSavedValueRef.current = value;
      onUpdate?.();
    } catch (error) {
      console.error('Erro ao salvar campo:', error);
      toast.error('Erro ao salvar');
    } finally {
      setIsSaving(false);
      isEditingRef.current = false;
    }
  }, [leadPhone, columnId, field.field_key, onUpdate]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    isEditingRef.current = true;
    setLocalValue(value);

    // Clear previous timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounce save
    saveTimeoutRef.current = setTimeout(() => {
      saveToDatabase(value);
    }, 800);
  }, [saveToDatabase]);

  const handleBlur = useCallback(() => {
    // Save immediately on blur if there's pending changes
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    if (localValue !== lastSavedValueRef.current) {
      saveToDatabase(localValue);
    } else {
      isEditingRef.current = false;
    }
  }, [localValue, saveToDatabase]);

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
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="..."
            disabled={isSaving}
            className="h-6 text-sm bg-transparent border-0 border-b border-[hsl(var(--avivar-primary))] rounded-none px-0 focus-visible:ring-0 focus-visible:border-[hsl(var(--avivar-primary))] text-[hsl(var(--avivar-foreground))] placeholder:text-[hsl(var(--avivar-muted-foreground)/0.5)] flex-1"
          />
        </div>
      );
  }
}
