/**
 * Hook para gerenciar leads do Kanban
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface KanbanLead {
  id: string;
  kanban_id: string;
  column_id: string;
  contact_id: string | null;
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  source: string | null;
  tags: string[] | null;
  order_index: number | null;
  custom_fields: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  // Last message preview
  last_message?: string | null;
  last_message_type?: string | null;
  last_message_direction?: 'inbound' | 'outbound' | null;
}

export function useKanbanLeads(kanbanId: string | undefined) {
  const queryClient = useQueryClient();

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['avivar-kanban-leads', kanbanId],
    queryFn: async () => {
      if (!kanbanId) return [];
      
      const { data, error } = await supabase
        .from('avivar_kanban_leads')
        .select('*')
        .eq('kanban_id', kanbanId)
        .order('order_index', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Fetch last message for each lead that has a phone number
      const leadsWithPhone = data.filter(lead => lead.phone);
      const phones = leadsWithPhone.map(lead => lead.phone!);
      
      if (phones.length === 0) {
        return data as KanbanLead[];
      }

      // Get last message for each phone from crm_messages via crm_conversations + leads
      const { data: leadsWithConvos } = await supabase
        .from('leads')
        .select('phone, crm_conversations(id)')
        .in('phone', phones);
      
      const phoneToConvoId = new Map<string, string>();
      if (leadsWithConvos) {
        for (const l of leadsWithConvos) {
          const convos = (l as any).crm_conversations;
          if (convos && convos.length > 0 && l.phone) {
            phoneToConvoId.set(l.phone, convos[0].id);
          }
        }
      }

      const conversationIds = [...phoneToConvoId.values()];
      let lastMessages: Record<string, { content: string | null; media_type: string | null; direction: string }> = {};
      
      if (conversationIds.length > 0) {
        const { data: messages } = await supabase
          .from('crm_messages')
          .select('conversation_id, content, media_type, direction, sent_at')
          .in('conversation_id', conversationIds)
          .order('sent_at', { ascending: false });
        
        if (messages) {
          const seen = new Set<string>();
          for (const msg of messages) {
            if (!seen.has(msg.conversation_id)) {
              seen.add(msg.conversation_id);
              // Find the phone for this conversation
              for (const [phone, convoId] of phoneToConvoId) {
                if (convoId === msg.conversation_id) {
                  lastMessages[phone] = {
                    content: msg.content,
                    media_type: msg.media_type,
                    direction: msg.direction,
                  };
                  break;
                }
              }
            }
          }
        }
      }
      
      // Merge last message info into leads
      return data.map(lead => ({
        ...lead,
        last_message: lead.phone ? lastMessages[lead.phone]?.content : null,
        last_message_type: lead.phone ? lastMessages[lead.phone]?.media_type : null,
        last_message_direction: lead.phone ? lastMessages[lead.phone]?.direction as 'inbound' | 'outbound' | null : null,
      })) as KanbanLead[];
    },
    enabled: !!kanbanId,
  });

  // Move lead to another column with checklist validation
  const moveLeadMutation = useMutation({
    mutationFn: async ({ leadId, columnId }: { leadId: string; columnId: string }) => {
      // Check if can move (checklist validation)
      const { data, error: checkError } = await supabase.rpc('can_move_lead_to_column', {
        _lead_id: leadId,
        _target_column_id: columnId
      });
      
      if (checkError) {
        console.error('Error checking move permission:', checkError);
        // If function doesn't exist yet, allow move
      } else if (data) {
        // Type assertion for the RPC response
        const result = data as { can_move?: boolean; missing_fields?: string[] };
        
        if (result.can_move === false) {
          const missingFields = result.missing_fields || [];
          const fieldsList = missingFields.length > 0 
            ? `\n\nCampos pendentes:\n• ${missingFields.join('\n• ')}`
            : '';
          throw new Error(`Preencha todos os campos obrigatórios do checklist antes de mover o lead.${fieldsList}`);
        }
      }
      
      const { error } = await supabase
        .from('avivar_kanban_leads')
        .update({ column_id: columnId, updated_at: new Date().toISOString() })
        .eq('id', leadId);
      
      if (error) throw error;
      
      return { leadId, columnId };
    },
    // Optimistic update - move lead immediately in UI
    onMutate: async ({ leadId, columnId }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['avivar-kanban-leads', kanbanId] });
      
      // Snapshot previous value
      const previousLeads = queryClient.getQueryData<KanbanLead[]>(['avivar-kanban-leads', kanbanId]);
      
      // Optimistically update the lead's column
      if (previousLeads) {
        const updatedLeads = previousLeads.map(lead => 
          lead.id === leadId 
            ? { ...lead, column_id: columnId, updated_at: new Date().toISOString() }
            : lead
        );
        queryClient.setQueryData(['avivar-kanban-leads', kanbanId], updatedLeads);
      }
      
      return { previousLeads };
    },
    onError: (error: Error, _variables, context) => {
      // Rollback on error
      if (context?.previousLeads) {
        queryClient.setQueryData(['avivar-kanban-leads', kanbanId], context.previousLeads);
      }
      console.error('Error moving lead:', error);
      toast.error(error.message || 'Erro ao mover lead');
    },
    onSettled: () => {
      // Refetch after mutation settles to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['avivar-kanban-leads', kanbanId] });
    },
  });

  // Delete lead with cascade (messages, conversations, journeys - but keeps contact)
  const deleteLeadMutation = useMutation({
    mutationFn: async (leadId: string) => {
      const { data, error } = await supabase.rpc('delete_avivar_kanban_lead_cascade', {
        p_lead_id: leadId
      });
      
      if (error) throw error;
      
      const result = data as { success: boolean; error?: string; lead_name?: string; deleted?: { messages: number; conversations: number; journeys: number } } | null;
      
      if (!result?.success) {
        throw new Error(result?.error || 'Erro ao excluir lead');
      }
      
      return result;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['avivar-kanban-leads', kanbanId] });
      queryClient.invalidateQueries({ queryKey: ['crm-conversations'] });
      queryClient.invalidateQueries({ queryKey: ['avivar-contacts'] });
      
      const deleted = result?.deleted;
      toast.success(
        `Lead "${result?.lead_name}" excluído! ` +
        `(${deleted?.messages || 0} msgs, ${deleted?.conversations || 0} conversas)`
      );
    },
    onError: (error) => {
      console.error('Error deleting lead:', error);
      toast.error('Erro ao excluir lead');
    },
  });

  // Get leads grouped by column
  const leadsByColumn = leads.reduce((acc, lead) => {
    if (!acc[lead.column_id]) {
      acc[lead.column_id] = [];
    }
    acc[lead.column_id].push(lead);
    return acc;
  }, {} as Record<string, KanbanLead[]>);

  return {
    leads,
    leadsByColumn,
    isLoading,
    moveLead: moveLeadMutation.mutate,
    deleteLead: deleteLeadMutation.mutate,
    refetch: () => queryClient.invalidateQueries({ queryKey: ['avivar-kanban-leads', kanbanId] }),
  };
}
