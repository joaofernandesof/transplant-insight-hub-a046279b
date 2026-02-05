/**
 * Hook para buscar campos do checklist de um kanban (universal para todos os leads)
 * e os valores preenchidos do lead específico
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
  options?: string[];
  required_for_columns?: string[];
}

/**
 * Hook para buscar campos do checklist do kanban
 * @param kanbanId - ID do kanban (campos são universais por kanban)
 * @param phone - Telefone do lead para buscar valores preenchidos
 */
export function useLeadChecklistFields(kanbanId: string | null | undefined, phone: string | null | undefined) {
  return useQuery({
    queryKey: ['lead-checklist-fields', kanbanId, phone],
    queryFn: async (): Promise<ChecklistFieldValue[]> => {
      if (!kanbanId) return [];

      // Buscar as colunas do kanban para pegar os campos de checklist
      const { data: columns, error: columnsError } = await supabase
        .from('avivar_kanban_columns')
        .select('id')
        .eq('kanban_id', kanbanId);

      if (columnsError || !columns || columns.length === 0) {
        return [];
      }

      const columnIds = columns.map(c => c.id);

      // Buscar os campos do checklist de todas as colunas do kanban
      // Isso permite campos universais - configurados em qualquer coluna aparecem para todos
      const { data: checklistFields, error: fieldsError } = await supabase
        .from('avivar_column_checklists')
        .select('*')
        .in('column_id', columnIds)
        .order('order_index');

      if (fieldsError || !checklistFields || checklistFields.length === 0) {
        return [];
      }

      // Deduplicar campos por field_key (pegar o primeiro de cada)
      const uniqueFieldsMap = new Map<string, typeof checklistFields[0]>();
      for (const field of checklistFields) {
        if (!uniqueFieldsMap.has(field.field_key)) {
          uniqueFieldsMap.set(field.field_key, field);
        }
      }
      const uniqueFields = Array.from(uniqueFieldsMap.values());

      // Buscar o lead pelo telefone para pegar os custom_fields
      let customFields: Record<string, unknown> = {};
      
      if (phone) {
        const { data: lead } = await supabase
          .from('avivar_kanban_leads')
          .select('custom_fields')
          .eq('phone', phone)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (lead?.custom_fields) {
          customFields = lead.custom_fields as Record<string, unknown>;
        }
      }

      // Combinar campos do checklist com valores do lead
      return uniqueFields.map(field => ({
        id: field.id,
        field_key: field.field_key,
        field_label: field.field_label,
        field_type: field.field_type,
        is_required: field.is_required ?? false,
        value: customFields[field.field_key] as string | boolean | null ?? null,
        options: (field.options as string[]) || [],
        required_for_columns: (field.required_for_columns as string[]) || [],
      }));
    },
    enabled: !!kanbanId,
    staleTime: 30000,
  });
}
