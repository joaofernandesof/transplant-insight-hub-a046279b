import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { toast } from 'sonner';

export interface SectorTicketType {
  id: string;
  sector_code: string;
  name: string;
  code: string;
  description: string | null;
  icon: string;
  color: string;
  is_active: boolean;
  order_index: number;
}

export interface SectorTicketStage {
  id: string;
  ticket_type_id: string;
  name: string;
  code: string;
  description: string | null;
  order_index: number;
  sla_hours: number | null;
  responsible_role: string | null;
  is_initial: boolean;
  is_final: boolean;
  icon: string | null;
  color: string | null;
}

export interface SectorTicket {
  id: string;
  ticket_number: number;
  ticket_type_id: string;
  sector_code: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  current_stage_id: string | null;
  requester_id: string;
  requester_name: string;
  assigned_to: string | null;
  assigned_name: string | null;
  branch: string | null;
  sla_deadline: string | null;
  sla_breached: boolean;
  metadata: Record<string, any>;
  checklist_data: Record<string, any>;
  created_at: string;
  updated_at: string;
  ticket_type?: SectorTicketType;
  current_stage?: SectorTicketStage;
}

export interface SectorTicketHistory {
  id: string;
  ticket_id: string;
  action: string;
  from_stage_name: string | null;
  to_stage_name: string | null;
  description: string | null;
  user_id: string | null;
  user_name: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export const SECTOR_LABELS: Record<string, string> = {
  tecnico: 'Técnico',
  sucesso_paciente: 'Pós-vendas',
  operacional: 'Operacional',
  processos: 'Processos',
  financeiro: 'Financeiro',
  juridico: 'Jurídico',
  marketing: 'Marketing',
  ti: 'TI',
  rh: 'RH',
  comercial: 'Comercial',
  compras: 'Compras',
  manutencao: 'Manutenção',
  gestao: 'Gestão',
};

export const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  baixa: { label: 'Baixa', color: 'bg-slate-100 text-slate-700' },
  normal: { label: 'Normal', color: 'bg-blue-100 text-blue-700' },
  alta: { label: 'Alta', color: 'bg-orange-100 text-orange-700' },
  urgente: { label: 'Urgente', color: 'bg-red-100 text-red-700' },
};

export const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  aberto: { label: 'Aberto', color: 'bg-blue-100 text-blue-700' },
  em_andamento: { label: 'Em Andamento', color: 'bg-amber-100 text-amber-700' },
  aguardando: { label: 'Aguardando', color: 'bg-purple-100 text-purple-700' },
  resolvido: { label: 'Resolvido', color: 'bg-green-100 text-green-700' },
  cancelado: { label: 'Cancelado', color: 'bg-red-100 text-red-700' },
};

export function useSectorTickets(sectorCode: string) {
  const queryClient = useQueryClient();
  const { user } = useUnifiedAuth();
  const userName = user?.email?.split('@')[0] || 'Usuário';

  const { data: ticketTypes = [], isLoading: isLoadingTypes } = useQuery({
    queryKey: ['sector-ticket-types', sectorCode],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sector_ticket_types')
        .select('*')
        .eq('sector_code', sectorCode)
        .eq('is_active', true)
        .order('order_index');
      if (error) throw error;
      return data as SectorTicketType[];
    },
  });

  const { data: stages = [] } = useQuery({
    queryKey: ['sector-ticket-stages', sectorCode, ticketTypes.map(t => t.id)],
    queryFn: async () => {
      const typeIds = ticketTypes.map(t => t.id);
      if (typeIds.length === 0) return [];
      const { data, error } = await supabase
        .from('sector_ticket_stages')
        .select('*')
        .in('ticket_type_id', typeIds)
        .order('order_index');
      if (error) throw error;
      return data as SectorTicketStage[];
    },
    enabled: ticketTypes.length > 0,
  });

  const { data: tickets = [], isLoading: isLoadingTickets } = useQuery({
    queryKey: ['sector-tickets', sectorCode],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sector_tickets')
        .select('*, ticket_type:sector_ticket_types(*), current_stage:sector_ticket_stages(*)')
        .eq('sector_code', sectorCode)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as SectorTicket[];
    },
  });

  const getStagesForType = (typeId: string) => {
    return stages.filter(s => s.ticket_type_id === typeId).sort((a, b) => a.order_index - b.order_index);
  };

  const createTicket = useMutation({
    mutationFn: async (input: {
      ticket_type_id: string;
      title: string;
      description?: string;
      priority?: string;
      branch?: string;
    }) => {
      const { data, error } = await supabase
        .from('sector_tickets')
        .insert({
          ...input,
          sector_code: sectorCode,
          requester_id: user?.id!,
          requester_name: userName,
          status: 'aberto',
          priority: input.priority || 'normal',
        })
        .select('*')
        .single();
      if (error) throw error;

      // Add creation history
      await supabase.from('sector_ticket_history').insert({
        ticket_id: data.id,
        action: 'criado',
        description: 'Chamado criado',
        user_id: user?.id,
        user_name: userName,
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sector-tickets', sectorCode] });
      toast.success('Chamado criado com sucesso!');
    },
    onError: (err: Error) => {
      toast.error(`Erro ao criar chamado: ${err.message}`);
    },
  });

  const advanceStage = useMutation({
    mutationFn: async ({ ticketId, nextStageId, comment }: { ticketId: string; nextStageId: string; comment?: string }) => {
      const ticket = tickets.find(t => t.id === ticketId);
      const fromStage = ticket?.current_stage;
      const toStage = stages.find(s => s.id === nextStageId);

      const newStatus = toStage?.is_final ? 'resolvido' : 'em_andamento';

      const { error } = await supabase
        .from('sector_tickets')
        .update({ current_stage_id: nextStageId, status: newStatus })
        .eq('id', ticketId);
      if (error) throw error;

      await supabase.from('sector_ticket_history').insert({
        ticket_id: ticketId,
        action: 'etapa_avancada',
        from_stage_name: fromStage?.name || null,
        to_stage_name: toStage?.name || null,
        description: comment || `Etapa avançada para ${toStage?.name}`,
        user_id: user?.id,
        user_name: userName,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sector-tickets', sectorCode] });
      toast.success('Etapa avançada!');
    },
    onError: (err: Error) => {
      toast.error(`Erro: ${err.message}`);
    },
  });

  const addComment = useMutation({
    mutationFn: async ({ ticketId, comment }: { ticketId: string; comment: string }) => {
      await supabase.from('sector_ticket_history').insert({
        ticket_id: ticketId,
        action: 'comentario',
        description: comment,
        user_id: user?.id,
        user_name: userName,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sector-ticket-history'] });
      toast.success('Comentário adicionado');
    },
  });

  const assignTicket = useMutation({
    mutationFn: async ({ ticketId, assignedTo, assignedName }: { ticketId: string; assignedTo: string; assignedName: string }) => {
      const { error } = await supabase
        .from('sector_tickets')
        .update({ assigned_to: assignedTo, assigned_name: assignedName })
        .eq('id', ticketId);
      if (error) throw error;

      await supabase.from('sector_ticket_history').insert({
        ticket_id: ticketId,
        action: 'atribuido',
        description: `Atribuído para ${assignedName}`,
        user_id: user?.id,
        user_name: userName,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sector-tickets', sectorCode] });
      toast.success('Chamado atribuído');
    },
  });

  // Ticket type CRUD for admin config
  const createTicketType = useMutation({
    mutationFn: async (input: { name: string; code: string; description?: string; icon?: string; color?: string }) => {
      const maxOrder = ticketTypes.reduce((max, t) => Math.max(max, t.order_index), 0);
      const { data, error } = await supabase
        .from('sector_ticket_types')
        .insert({ ...input, sector_code: sectorCode, order_index: maxOrder + 1 })
        .select()
        .single();
      if (error) throw error;

      // Create default stages
      const defaultStages = [
        { code: 'aberto', name: 'Aberto', order_index: 1, is_initial: true, is_final: false },
        { code: 'em_analise', name: 'Em Análise', order_index: 2, sla_hours: 24, is_initial: false, is_final: false },
        { code: 'em_execucao', name: 'Em Execução', order_index: 3, sla_hours: 48, is_initial: false, is_final: false },
        { code: 'revisao', name: 'Revisão', order_index: 4, sla_hours: 24, is_initial: false, is_final: false },
        { code: 'concluido', name: 'Concluído', order_index: 5, is_initial: false, is_final: true },
      ];
      await supabase.from('sector_ticket_stages').insert(
        defaultStages.map(s => ({ ...s, ticket_type_id: data.id }))
      );

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sector-ticket-types', sectorCode] });
      queryClient.invalidateQueries({ queryKey: ['sector-ticket-stages', sectorCode] });
      toast.success('Tipo de chamado criado!');
    },
    onError: (err: Error) => {
      toast.error(`Erro: ${err.message}`);
    },
  });

  const deleteTicketType = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('sector_ticket_types').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sector-ticket-types', sectorCode] });
      toast.success('Tipo de chamado excluído');
    },
  });

  return {
    ticketTypes,
    stages,
    tickets,
    isLoading: isLoadingTypes || isLoadingTickets,
    getStagesForType,
    createTicket,
    advanceStage,
    addComment,
    assignTicket,
    createTicketType,
    deleteTicketType,
  };
}

export function useSectorTicketHistory(ticketId?: string) {
  const { data: history = [], isLoading } = useQuery({
    queryKey: ['sector-ticket-history', ticketId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sector_ticket_history')
        .select('*')
        .eq('ticket_id', ticketId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as SectorTicketHistory[];
    },
    enabled: !!ticketId,
  });
  return { history, isLoading };
}
