import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAvivarAccount } from '@/hooks/useAvivarAccount';
import { toast } from 'sonner';

export type DuplicateAction = 'block' | 'merge' | 'allow_tagged';
export type DuplicateField = 'phone' | 'email' | 'phone_or_email';

export interface DuplicateSettings {
  enabled: boolean;
  check_field: DuplicateField;
  action: DuplicateAction;
}

const DEFAULT_DUPLICATE_SETTINGS: DuplicateSettings = {
  enabled: true,
  check_field: 'phone_or_email',
  action: 'merge',
};

export function useAccountSettings() {
  const { accountId } = useAvivarAccount();
  const queryClient = useQueryClient();

  const { data: duplicateSettings = DEFAULT_DUPLICATE_SETTINGS, isLoading } = useQuery({
    queryKey: ['avivar-account-settings', 'duplicate_handling', accountId],
    queryFn: async () => {
      if (!accountId) return DEFAULT_DUPLICATE_SETTINGS;
      const { data, error } = await supabase
        .from('avivar_account_settings')
        .select('setting_value')
        .eq('account_id', accountId)
        .eq('setting_key', 'duplicate_handling')
        .maybeSingle();
      if (error) throw error;
      if (!data) return DEFAULT_DUPLICATE_SETTINGS;
      return { ...DEFAULT_DUPLICATE_SETTINGS, ...(data.setting_value as Record<string, unknown>) } as DuplicateSettings;
    },
    enabled: !!accountId,
  });

  const saveDuplicateSettings = useMutation({
    mutationFn: async (settings: DuplicateSettings) => {
      if (!accountId) throw new Error('Conta não encontrada');
      
      // Upsert
      const { data: existing } = await supabase
        .from('avivar_account_settings')
        .select('id')
        .eq('account_id', accountId)
        .eq('setting_key', 'duplicate_handling')
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('avivar_account_settings')
          .update({ setting_value: settings as unknown as Record<string, never> })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('avivar_account_settings')
          .insert({
            account_id: accountId,
            setting_key: 'duplicate_handling',
            setting_value: settings as unknown as Record<string, never>,
          } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avivar-account-settings'] });
      toast.success('Configurações de duplicata salvas!');
    },
    onError: () => {
      toast.error('Erro ao salvar configurações');
    },
  });

  return { duplicateSettings, isLoading, saveDuplicateSettings };
}
