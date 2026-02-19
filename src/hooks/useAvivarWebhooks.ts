import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAvivarAccount } from '@/hooks/useAvivarAccount';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { toast } from 'sonner';

export interface AvivarWebhook {
  id: string;
  account_id: string;
  name: string;
  url: string;
  events: string[];
  secret: string | null;
  is_active: boolean;
  last_triggered_at: string | null;
  failure_count: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AvivarWebhookLog {
  id: string;
  webhook_id: string;
  event: string;
  payload: any;
  response_status: number | null;
  response_body: string | null;
  success: boolean | null;
  created_at: string;
}

export const WEBHOOK_EVENTS = [
  { value: 'lead.created', label: 'Lead criado' },
  { value: 'lead.updated', label: 'Lead atualizado' },
  { value: 'message.received', label: 'Mensagem recebida' },
  { value: 'message.sent', label: 'Mensagem enviada' },
  { value: 'appointment.created', label: 'Agendamento criado' },
  { value: 'appointment.updated', label: 'Agendamento atualizado' },
];

export function useAvivarWebhooks() {
  const { session } = useUnifiedAuth();
  const { accountId } = useAvivarAccount();
  const queryClient = useQueryClient();

  const { data: webhooks = [], isLoading } = useQuery({
    queryKey: ['avivar-webhooks', accountId],
    queryFn: async () => {
      if (!accountId) return [];
      const { data, error } = await supabase
        .from('avivar_webhooks')
        .select('*')
        .eq('account_id', accountId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as AvivarWebhook[];
    },
    enabled: !!accountId,
  });

  const createWebhook = useMutation({
    mutationFn: async (webhook: { name: string; url: string; events: string[]; secret?: string }) => {
      if (!accountId || !session?.user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('avivar_webhooks')
        .insert({
          account_id: accountId,
          name: webhook.name,
          url: webhook.url,
          events: webhook.events,
          secret: webhook.secret || null,
          created_by: session.user.id,
        } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avivar-webhooks'] });
      toast.success('Webhook criado com sucesso!');
    },
    onError: () => toast.error('Erro ao criar webhook'),
  });

  const updateWebhook = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name?: string; url?: string; events?: string[]; secret?: string; is_active?: boolean }) => {
      const { error } = await supabase
        .from('avivar_webhooks')
        .update({ ...data, updated_at: new Date().toISOString() } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avivar-webhooks'] });
      toast.success('Webhook atualizado');
    },
    onError: () => toast.error('Erro ao atualizar webhook'),
  });

  const deleteWebhook = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('avivar_webhooks')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avivar-webhooks'] });
      toast.success('Webhook excluído');
    },
    onError: () => toast.error('Erro ao excluir webhook'),
  });

  return { webhooks, isLoading, createWebhook, updateWebhook, deleteWebhook };
}

export function useAvivarWebhookLogs(webhookId?: string) {
  const { accountId } = useAvivarAccount();

  return useQuery({
    queryKey: ['avivar-webhook-logs', webhookId],
    queryFn: async () => {
      if (!accountId || !webhookId) return [];
      const { data, error } = await supabase
        .from('avivar_webhook_logs')
        .select('*')
        .eq('webhook_id', webhookId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as AvivarWebhookLog[];
    },
    enabled: !!accountId && !!webhookId,
  });
}
