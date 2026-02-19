import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAvivarAccount } from '@/hooks/useAvivarAccount';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { toast } from 'sonner';

// =============================================
// Types
// =============================================

export interface AutomationCondition {
  field: string;
  operator: string;
  value: string | number | boolean | null;
}

export interface AutomationConditionGroup {
  logic: 'AND' | 'OR' | 'NOT';
  groups: (AutomationCondition | AutomationConditionGroup)[];
}

export interface AvivarAutomation {
  id: string;
  account_id: string;
  kanban_id: string | null;
  column_id: string | null;
  name: string;
  description: string | null;
  trigger_type: string;
  trigger_config: Record<string, any>;
  conditions: AutomationConditionGroup | Record<string, never>;
  is_active: boolean;
  is_global: boolean;
  execution_order: number;
  delay_seconds: number;
  max_executions_per_lead: number | null;
  cooldown_seconds: number;
  execute_once_per_lead: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AvivarAutomationAction {
  id: string;
  automation_id: string;
  action_type: string;
  action_config: Record<string, any>;
  order_index: number;
  delay_seconds: number;
  created_at: string;
}

export interface AvivarAutomationExecution {
  id: string;
  automation_id: string;
  account_id: string;
  lead_id: string | null;
  conversation_id: string | null;
  trigger_event: string;
  trigger_data: Record<string, any> | null;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  actions_log: any[];
  retry_count: number;
  max_retries: number;
  next_retry_at: string | null;
  created_at: string;
}

// =============================================
// Trigger & Action Definitions
// =============================================

export const TRIGGER_CATEGORIES = [
  {
    category: 'Eventos de Lead',
    triggers: [
      { value: 'lead.created', label: 'Lead criado' },
      { value: 'lead.created_in_stage', label: 'Lead criado em etapa específica' },
      { value: 'lead.moved_from', label: 'Lead movido de etapa' },
      { value: 'lead.moved_to', label: 'Lead movido para etapa' },
      { value: 'lead.pipeline_changed', label: 'Mudança de pipeline' },
      { value: 'lead.won', label: 'Lead ganho' },
      { value: 'lead.lost', label: 'Lead perdido' },
      { value: 'lead.field_changed', label: 'Campo alterado' },
      { value: 'lead.value_changed', label: 'Valor alterado' },
      { value: 'lead.tag_added', label: 'Tag adicionada' },
      { value: 'lead.tag_removed', label: 'Tag removida' },
      { value: 'lead.responsible_changed', label: 'Responsável alterado' },
    ],
  },
  {
    category: 'Eventos de Comunicação',
    triggers: [
      { value: 'message.received', label: 'Mensagem recebida' },
      { value: 'message.sent', label: 'Mensagem enviada' },
      { value: 'conversation.started', label: 'Nova conversa iniciada' },
      { value: 'call.received', label: 'Ligação recebida' },
      { value: 'email.received', label: 'Email recebido' },
    ],
  },
  {
    category: 'Eventos de Tarefa',
    triggers: [
      { value: 'task.created', label: 'Tarefa criada' },
      { value: 'task.completed', label: 'Tarefa concluída' },
      { value: 'task.overdue', label: 'Tarefa atrasada' },
    ],
  },
  {
    category: 'Eventos de Contato',
    triggers: [
      { value: 'contact.created', label: 'Contato criado' },
      { value: 'contact.field_changed', label: 'Campo alterado' },
      { value: 'contact.phone_added', label: 'Telefone adicionado' },
      { value: 'contact.email_added', label: 'Email adicionado' },
      { value: 'contact.tag_added', label: 'Tag adicionada' },
    ],
  },
  {
    category: 'Eventos de Agendamento',
    triggers: [
      { value: 'appointment.created', label: 'Agendamento criado' },
      { value: 'appointment.updated', label: 'Agendamento atualizado' },
      { value: 'appointment.cancelled', label: 'Agendamento cancelado' },
    ],
  },
  {
    category: 'Eventos de Integração',
    triggers: [
      { value: 'webhook.received', label: 'Webhook recebido' },
      { value: 'payment.approved', label: 'Pagamento aprovado' },
      { value: 'custom.external', label: 'Evento customizado externo' },
    ],
  },
];

export const ACTION_TYPES = [
  { value: 'change_stage', label: 'Alterar etapa', icon: 'ArrowRight' },
  { value: 'change_responsible', label: 'Alterar responsável', icon: 'UserCheck' },
  { value: 'create_task', label: 'Criar tarefa', icon: 'ListTodo' },
  { value: 'send_message', label: 'Enviar mensagem', icon: 'MessageSquare' },
  { value: 'trigger_chatbot', label: 'Disparar chatbot', icon: 'Bot' },
  { value: 'add_tag', label: 'Adicionar tag', icon: 'Tag' },
  { value: 'remove_tag', label: 'Remover tag', icon: 'TagX' },
  { value: 'change_field', label: 'Alterar campo', icon: 'Edit' },
  { value: 'create_lead', label: 'Criar lead', icon: 'UserPlus' },
  { value: 'create_contact', label: 'Criar contato', icon: 'Contact' },
  { value: 'create_note', label: 'Criar nota', icon: 'StickyNote' },
  { value: 'dispatch_webhook', label: 'Disparar webhook externo', icon: 'Webhook' },
  { value: 'execute_integration', label: 'Executar integração externa', icon: 'Plug' },
];

export const CONDITION_OPERATORS = [
  { value: 'equals', label: 'é igual a' },
  { value: 'not_equals', label: 'é diferente de' },
  { value: 'contains', label: 'contém' },
  { value: 'not_contains', label: 'não contém' },
  { value: 'starts_with', label: 'começa com' },
  { value: 'ends_with', label: 'termina com' },
  { value: 'greater_than', label: 'maior que' },
  { value: 'less_than', label: 'menor que' },
  { value: 'greater_or_equal', label: 'maior ou igual a' },
  { value: 'less_or_equal', label: 'menor ou igual a' },
  { value: 'is_empty', label: 'está vazio' },
  { value: 'is_not_empty', label: 'não está vazio' },
  { value: 'in', label: 'está em' },
  { value: 'not_in', label: 'não está em' },
  { value: 'time_elapsed_gt', label: 'tempo decorrido maior que' },
  { value: 'time_elapsed_lt', label: 'tempo decorrido menor que' },
  { value: 'date_before', label: 'data antes de' },
  { value: 'date_after', label: 'data depois de' },
];

export const CONDITION_FIELDS = [
  { value: 'source', label: 'Origem' },
  { value: 'tag', label: 'Tag' },
  { value: 'responsible', label: 'Responsável' },
  { value: 'pipeline', label: 'Pipeline' },
  { value: 'stage', label: 'Etapa' },
  { value: 'name', label: 'Nome' },
  { value: 'phone', label: 'Telefone' },
  { value: 'email', label: 'Email' },
  { value: 'custom_field', label: 'Campo personalizado' },
  { value: 'created_at', label: 'Data de criação' },
  { value: 'updated_at', label: 'Última atualização' },
  { value: 'inactivity_hours', label: 'Horas de inatividade' },
  { value: 'channel', label: 'Canal de origem' },
  { value: 'utm_source', label: 'utm_source' },
  { value: 'utm_medium', label: 'utm_medium' },
  { value: 'utm_campaign', label: 'utm_campaign' },
];

// =============================================
// Hooks
// =============================================

export function useAvivarAutomations(kanbanId?: string) {
  const { session } = useUnifiedAuth();
  const { accountId } = useAvivarAccount();
  const queryClient = useQueryClient();

  const { data: automations = [], isLoading } = useQuery({
    queryKey: ['avivar-automations', accountId, kanbanId],
    queryFn: async () => {
      if (!accountId) return [];
      let query = supabase
        .from('avivar_automations')
        .select('*')
        .eq('account_id', accountId)
        .order('execution_order', { ascending: true });

      if (kanbanId) {
        query = query.or(`kanban_id.eq.${kanbanId},is_global.eq.true`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as AvivarAutomation[];
    },
    enabled: !!accountId,
  });

  const { data: actions = [] } = useQuery({
    queryKey: ['avivar-automation-actions', automations.map(a => a.id)],
    queryFn: async () => {
      if (automations.length === 0) return [];
      const { data, error } = await supabase
        .from('avivar_automation_actions')
        .select('*')
        .in('automation_id', automations.map(a => a.id))
        .order('order_index', { ascending: true });
      if (error) throw error;
      return data as AvivarAutomationAction[];
    },
    enabled: automations.length > 0,
  });

  const createAutomation = useMutation({
    mutationFn: async (input: {
      name: string;
      description?: string;
      trigger_type: string;
      trigger_config?: Record<string, any>;
      conditions?: AutomationConditionGroup;
      kanban_id?: string;
      column_id?: string;
      is_global?: boolean;
      delay_seconds?: number;
      execute_once_per_lead?: boolean;
      actions: { action_type: string; action_config: Record<string, any>; order_index: number; delay_seconds?: number }[];
    }) => {
      if (!accountId || !session?.user) throw new Error('Not authenticated');

      const { actions: actionsList, ...automationData } = input;

      const { data: automation, error } = await supabase
        .from('avivar_automations')
        .insert({
          account_id: accountId,
          created_by: session.user.id,
          ...automationData,
          conditions: automationData.conditions || {},
          trigger_config: automationData.trigger_config || {},
        } as any)
        .select()
        .single();

      if (error) throw error;

      // Insert actions
      if (actionsList.length > 0) {
        const { error: actionsError } = await supabase
          .from('avivar_automation_actions')
          .insert(
            actionsList.map(a => ({
              automation_id: automation.id,
              action_type: a.action_type,
              action_config: a.action_config,
              order_index: a.order_index,
              delay_seconds: a.delay_seconds || 0,
            })) as any
          );
        if (actionsError) throw actionsError;
      }

      return automation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avivar-automations'] });
      queryClient.invalidateQueries({ queryKey: ['avivar-automation-actions'] });
      toast.success('Automação criada com sucesso!');
    },
    onError: () => toast.error('Erro ao criar automação'),
  });

  const updateAutomation = useMutation({
    mutationFn: async ({ id, actions: actionsList, ...data }: {
      id: string;
      name?: string;
      description?: string;
      trigger_type?: string;
      trigger_config?: Record<string, any>;
      conditions?: AutomationConditionGroup;
      column_id?: string | null;
      is_active?: boolean;
      is_global?: boolean;
      delay_seconds?: number;
      execute_once_per_lead?: boolean;
      actions?: { action_type: string; action_config: Record<string, any>; order_index: number; delay_seconds?: number }[];
    }) => {
      const { error } = await supabase
        .from('avivar_automations')
        .update(data as any)
        .eq('id', id);
      if (error) throw error;

      // Replace actions if provided
      if (actionsList) {
        await supabase
          .from('avivar_automation_actions')
          .delete()
          .eq('automation_id', id);

        if (actionsList.length > 0) {
          const { error: actionsError } = await supabase
            .from('avivar_automation_actions')
            .insert(
              actionsList.map(a => ({
                automation_id: id,
                action_type: a.action_type,
                action_config: a.action_config,
                order_index: a.order_index,
                delay_seconds: a.delay_seconds || 0,
              })) as any
            );
          if (actionsError) throw actionsError;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avivar-automations'] });
      queryClient.invalidateQueries({ queryKey: ['avivar-automation-actions'] });
      toast.success('Automação atualizada!');
    },
    onError: () => toast.error('Erro ao atualizar automação'),
  });

  const deleteAutomation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('avivar_automations')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avivar-automations'] });
      toast.success('Automação excluída!');
    },
    onError: () => toast.error('Erro ao excluir automação'),
  });

  const toggleAutomation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('avivar_automations')
        .update({ is_active } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avivar-automations'] });
    },
  });

  // Group actions by automation
  const actionsByAutomation: Record<string, AvivarAutomationAction[]> = {};
  actions.forEach(a => {
    if (!actionsByAutomation[a.automation_id]) actionsByAutomation[a.automation_id] = [];
    actionsByAutomation[a.automation_id].push(a);
  });

  return {
    automations,
    actionsByAutomation,
    isLoading,
    createAutomation,
    updateAutomation,
    deleteAutomation,
    toggleAutomation,
  };
}

export function useAvivarAutomationExecutions(automationId?: string) {
  const { accountId } = useAvivarAccount();

  return useQuery({
    queryKey: ['avivar-automation-executions', automationId],
    queryFn: async () => {
      if (!accountId) return [];
      let query = supabase
        .from('avivar_automation_executions')
        .select('*')
        .eq('account_id', accountId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (automationId) {
        query = query.eq('automation_id', automationId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as AvivarAutomationExecution[];
    },
    enabled: !!accountId,
  });
}
