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
  tags: string[];
  tratamento: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmTerm: string | null;
  utmContent: string | null;
}

export function useLeadKanbanInfo(phone: string | undefined | null) {
  return useQuery({
    queryKey: ['lead-kanban-info', phone],
    queryFn: async (): Promise<KanbanInfo> => {
      if (!phone) {
        return { kanbanName: null, columnName: null, kanbanId: null, columnId: null, tags: [], tratamento: null, utmSource: null, utmMedium: null, utmCampaign: null, utmTerm: null, utmContent: null };
      }

      const { data: kanbanLead, error: leadError } = await supabase
        .from('avivar_kanban_leads')
        .select(`
          kanban_id,
          column_id,
          tags,
          custom_fields,
          utm_source,
          utm_medium,
          utm_campaign,
          utm_term,
          utm_content,
          kanban:avivar_kanbans(id, name, order_index),
          column:avivar_kanban_columns(id, name)
        `)
        .eq('phone', phone)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (leadError || !kanbanLead) {
        return { kanbanName: null, columnName: null, kanbanId: null, columnId: null, tags: [], tratamento: null, utmSource: null, utmMedium: null, utmCampaign: null, utmTerm: null, utmContent: null };
      }

      const kanban = kanbanLead.kanban as { id: string; name: string; order_index: number } | null;
      const column = kanbanLead.column as { id: string; name: string } | null;
      const tags = (kanbanLead.tags as string[]) || [];
      const customFields = kanbanLead.custom_fields as Record<string, unknown> | null;
      const tratamento = (customFields?.tratamento as string) || null;

      return {
        kanbanName: kanban?.name || null,
        columnName: column?.name || null,
        kanbanId: kanban?.id || null,
        columnId: column?.id || null,
        tags,
        tratamento,
        utmSource: (kanbanLead as any).utm_source || null,
        utmMedium: (kanbanLead as any).utm_medium || null,
        utmCampaign: (kanbanLead as any).utm_campaign || null,
        utmTerm: (kanbanLead as any).utm_term || null,
        utmContent: (kanbanLead as any).utm_content || null,
      };
    },
    enabled: !!phone,
    staleTime: 30000, // 30 seconds
  });
}
