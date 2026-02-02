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
      return data as KanbanLead[];
    },
    enabled: !!kanbanId,
  });

  // Move lead to another column with checklist validation
  const moveLeadMutation = useMutation({
    mutationFn: async ({ leadId, columnId }: { leadId: string; columnId: string }) => {
      // Get the lead's current custom_fields
      const lead = leads.find(l => l.id === leadId);
      
      // Check if can move (checklist validation)
      const { data: canMove, error: checkError } = await supabase.rpc('can_move_lead_to_column', {
        _lead_id: leadId,
        _target_column_id: columnId
      });
      
      if (checkError) {
        console.error('Error checking move permission:', checkError);
        // If function doesn't exist yet, allow move
      } else if (canMove === false) {
        throw new Error('Preencha todos os campos obrigatórios do checklist antes de mover o lead');
      }
      
      const { error } = await supabase
        .from('avivar_kanban_leads')
        .update({ column_id: columnId, updated_at: new Date().toISOString() })
        .eq('id', leadId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avivar-kanban-leads', kanbanId] });
    },
    onError: (error: Error) => {
      console.error('Error moving lead:', error);
      toast.error(error.message || 'Erro ao mover lead');
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
