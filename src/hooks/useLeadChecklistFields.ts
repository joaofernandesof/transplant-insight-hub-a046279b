/**
 * Hook para buscar campos do checklist de uma coluna e os valores preenchidos do lead
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ChecklistFieldValue {
  id: string;
  field_key: string;
  field_label: string;
  field_type: string;
  is_required: boolean;
  value: string | boolean | null;
}

export function useLeadChecklistFields(columnId: string | null | undefined, phone: string | null | undefined) {
  return useQuery({
    queryKey: ['lead-checklist-fields', columnId, phone],
    queryFn: async (): Promise<ChecklistFieldValue[]> => {
      if (!columnId) return [];

      // Buscar os campos do checklist da coluna
      const { data: checklistFields, error: fieldsError } = await supabase
        .from('avivar_column_checklists')
        .select('*')
        .eq('column_id', columnId)
        .order('order_index');

      if (fieldsError || !checklistFields || checklistFields.length === 0) {
        return [];
      }

      // Buscar o lead pelo telefone para pegar os custom_fields
      let customFields: Record<string, unknown> = {};
      
      if (phone) {
        const { data: lead } = await supabase
          .from('avivar_kanban_leads')
          .select('custom_fields')
          .eq('phone', phone)
          .eq('column_id', columnId)
          .maybeSingle();

        if (lead?.custom_fields) {
          customFields = lead.custom_fields as Record<string, unknown>;
        }
      }

      // Combinar campos do checklist com valores do lead
      return checklistFields.map(field => ({
        id: field.id,
        field_key: field.field_key,
        field_label: field.field_label,
        field_type: field.field_type,
        is_required: field.is_required ?? false,
        value: customFields[field.field_key] as string | boolean | null ?? null,
      }));
    },
    enabled: !!columnId,
    staleTime: 30000,
  });
}
