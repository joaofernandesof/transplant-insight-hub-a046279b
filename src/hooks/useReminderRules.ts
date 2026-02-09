import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface ReminderRule {
  id: string;
  account_id: string;
  user_id: string;
  name: string;
  time_before_minutes: number;
  time_before_type: 'minutes' | 'hours' | 'days';
  time_before_value: number;
  message_template: string;
  is_active: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface CreateReminderRuleInput {
  name: string;
  time_before_minutes: number;
  time_before_type: 'minutes' | 'hours' | 'days';
  time_before_value: number;
  message_template: string;
  is_active?: boolean;
  order_index?: number;
}

export function useReminderRules() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['reminder-rules', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await (supabase
        .from('avivar_reminder_rules' as any)
        .select('*')
        .order('time_before_minutes', { ascending: false }) as any);

      if (error) throw error;
      return data as ReminderRule[];
    },
    enabled: !!user?.id,
  });

  const createRule = useMutation({
    mutationFn: async (input: CreateReminderRuleInput) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const { data: memberData } = await supabase
        .from('avivar_account_members')
        .select('account_id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (!memberData?.account_id) throw new Error('Conta não encontrada');

      const { data, error } = await (supabase
        .from('avivar_reminder_rules' as any)
        .insert({
          user_id: user.id,
          account_id: memberData.account_id,
          ...input,
        })
        .select()
        .single() as any);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminder-rules'] });
      toast.success('Regra de lembrete criada!');
    },
    onError: () => {
      toast.error('Erro ao criar regra');
    },
  });

  const updateRule = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ReminderRule> & { id: string }) => {
      const { data, error } = await (supabase
        .from('avivar_reminder_rules' as any)
        .update(updates)
        .eq('id', id)
        .select()
        .single() as any);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminder-rules'] });
      toast.success('Regra atualizada!');
    },
    onError: () => {
      toast.error('Erro ao atualizar regra');
    },
  });

  const toggleRule = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await (supabase
        .from('avivar_reminder_rules' as any)
        .update({ is_active })
        .eq('id', id) as any);

      if (error) throw error;
    },
    onSuccess: (_, { is_active }) => {
      queryClient.invalidateQueries({ queryKey: ['reminder-rules'] });
      toast.success(is_active ? 'Lembrete ativado!' : 'Lembrete desativado!');
    },
    onError: () => {
      toast.error('Erro ao alterar status');
    },
  });

  const deleteRule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase
        .from('avivar_reminder_rules' as any)
        .delete()
        .eq('id', id) as any);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminder-rules'] });
      toast.success('Regra excluída!');
    },
    onError: () => {
      toast.error('Erro ao excluir regra');
    },
  });

  return {
    rules,
    isLoading,
    createRule,
    updateRule,
    toggleRule,
    deleteRule,
  };
}
