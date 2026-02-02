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

  // Move lead to another column
  const moveLeadMutation = useMutation({
    mutationFn: async ({ leadId, columnId }: { leadId: string; columnId: string }) => {
      const { error } = await supabase
        .from('avivar_kanban_leads')
        .update({ column_id: columnId, updated_at: new Date().toISOString() })
        .eq('id', leadId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avivar-kanban-leads', kanbanId] });
    },
    onError: (error) => {
      console.error('Error moving lead:', error);
      toast.error('Erro ao mover lead');
    },
  });

  // Delete lead
  const deleteLeadMutation = useMutation({
    mutationFn: async (leadId: string) => {
      const { error } = await supabase
        .from('avivar_kanban_leads')
        .delete()
        .eq('id', leadId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avivar-kanban-leads', kanbanId] });
      toast.success('Lead excluído!');
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
