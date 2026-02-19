import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAvivarAccount } from '@/hooks/useAvivarAccount';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';

export interface LeadStats {
  totalMessages: number;
  daysSinceCreation: number;
  lastInteraction: string | null;
  currentStage: string | null;
}

export interface CrmStats {
  totalActiveLeads: number;
  convertedLeads: number;
  conversionRate: number;
  myLeads: number;
  leadsByStage: Record<string, number>;
}

export function useLeadStatistics(conversationId?: string, leadId?: string) {
  const { session } = useUnifiedAuth();
  const { accountId } = useAvivarAccount();

  const leadStats = useQuery({
    queryKey: ['lead-stats', conversationId],
    queryFn: async (): Promise<LeadStats> => {
      if (!conversationId) return { totalMessages: 0, daysSinceCreation: 0, lastInteraction: null, currentStage: null };

      // Get message count
      const { count: msgCount } = await supabase
        .from('crm_messages')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', conversationId);

      // Get conversation details
      const { data: conv } = await supabase
        .from('crm_conversations')
        .select('created_at, last_message_at')
        .eq('id', conversationId)
        .single();

      const daysSinceCreation = conv
        ? Math.floor((Date.now() - new Date(conv.created_at).getTime()) / 86400000)
        : 0;

      return {
        totalMessages: msgCount || 0,
        daysSinceCreation,
        lastInteraction: conv?.last_message_at || null,
        currentStage: null,
      };
    },
    enabled: !!conversationId,
  });

  const crmStats = useQuery({
    queryKey: ['crm-stats', accountId],
    queryFn: async (): Promise<CrmStats> => {
      if (!accountId) return { totalActiveLeads: 0, convertedLeads: 0, conversionRate: 0, myLeads: 0, leadsByStage: {} };

      // Total leads in kanban
      const { count: total } = await supabase
        .from('avivar_kanban_leads')
        .select('*', { count: 'exact', head: true })
        .eq('account_id', accountId);

      // Leads by column (stage)
      const { data: columns } = await supabase
        .from('avivar_kanban_columns')
        .select('id, name')
        .eq('account_id', accountId);

      const leadsByStage: Record<string, number> = {};
      if (columns) {
        for (const col of columns) {
          const { count } = await supabase
            .from('avivar_kanban_leads')
            .select('*', { count: 'exact', head: true })
            .eq('column_id', col.id);
          leadsByStage[col.name] = count || 0;
        }
      }

      // My leads (assigned conversations)
      const authId = session?.user?.id;
      const { count: myCount } = await supabase
        .from('crm_conversations')
        .select('*', { count: 'exact', head: true })
        .eq('account_id', accountId)
        .eq('assigned_to', authId || '');

      return {
        totalActiveLeads: total || 0,
        convertedLeads: 0,
        conversionRate: 0,
        myLeads: myCount || 0,
        leadsByStage,
      };
    },
    enabled: !!accountId,
    staleTime: 60000, // 1 min cache
  });

  return { leadStats, crmStats };
}
