/**
 * Hook para buscar informações do Kanban/Coluna de um lead
 * Prioriza o lead mais recente por updated_at e filtra pelo primeiro kanban (order_index)
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
      // Ordenar por kanban order_index para priorizar o Comercial (order_index=0)
      // Isso garante que novos leads sempre mostrem o kanban principal primeiro
      const { data: kanbanLead, error: leadError } = await supabase
        .from('avivar_kanban_leads')
        .select(`
          kanban_id,
          column_id,
          kanban:avivar_kanbans(id, name, order_index),
          column:avivar_kanban_columns(id, name)
        `)
        .eq('phone', phone)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (leadError || !kanbanLead) {
        return { kanbanName: null, columnName: null, kanbanId: null, columnId: null };
      }

      const kanban = kanbanLead.kanban as { id: string; name: string; order_index: number } | null;
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
