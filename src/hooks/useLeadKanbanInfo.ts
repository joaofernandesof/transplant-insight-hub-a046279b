/**
 * Hook para buscar informações do Kanban/Coluna de um lead
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface KanbanInfo {
  kanbanName: string | null;
  columnName: string | null;
  kanbanId: string | null;
  columnId: string | null;
}

export function useLeadKanbanInfo(phone: string | undefined | null) {
  return useQuery({
    queryKey: ['lead-kanban-info', phone],
    queryFn: async (): Promise<KanbanInfo> => {
      if (!phone) {
        return { kanbanName: null, columnName: null, kanbanId: null, columnId: null };
      }

      // Buscar o lead no kanban pelo telefone
      const { data: kanbanLead, error: leadError } = await supabase
        .from('avivar_kanban_leads')
        .select(`
          kanban_id,
          column_id,
          kanban:avivar_kanbans(id, name),
          column:avivar_kanban_columns(id, name)
        `)
        .eq('phone', phone)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (leadError || !kanbanLead) {
        return { kanbanName: null, columnName: null, kanbanId: null, columnId: null };
      }

      const kanban = kanbanLead.kanban as { id: string; name: string } | null;
      const column = kanbanLead.column as { id: string; name: string } | null;

      return {
        kanbanName: kanban?.name || null,
        columnName: column?.name || null,
        kanbanId: kanban?.id || null,
        columnId: column?.id || null,
      };
    },
    enabled: !!phone,
    staleTime: 30000, // 30 seconds
  });
}
