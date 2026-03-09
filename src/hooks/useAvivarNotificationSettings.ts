/**
 * useAvivarNotificationSettings — persists notification preferences per user
 * Uses avivar_account_settings with setting_key = 'notification_prefs_<userId>'
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAvivarAccount } from '@/hooks/useAvivarAccount';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { toast } from 'sonner';

export interface NotificationPreferences {
  newLead: boolean;
  newMessage: boolean;
  leadMoved: boolean;
  taskOverdue: boolean;
  appointmentReminder: boolean;
  dailySummary: boolean;
  weeklyReport: boolean;
}

const DEFAULT_PREFS: NotificationPreferences = {
  newLead: true,
  newMessage: true,
  leadMoved: true,
  taskOverdue: true,
  appointmentReminder: true,
  dailySummary: false,
  weeklyReport: true,
};

export function useAvivarNotificationSettings() {
  const { accountId } = useAvivarAccount();
  const { session } = useUnifiedAuth();
  const userId = session?.user?.id;
  const queryClient = useQueryClient();
  const settingKey = `notification_prefs_${userId}`;

  const { data: settings = DEFAULT_PREFS, isLoading } = useQuery({
    queryKey: ['avivar-notification-settings', accountId, userId],
    queryFn: async () => {
      if (!accountId || !userId) return DEFAULT_PREFS;
      const { data } = await supabase
        .from('avivar_account_settings')
        .select('setting_value')
        .eq('account_id', accountId)
        .eq('setting_key', settingKey)
        .maybeSingle();

      if (!data) return DEFAULT_PREFS;
      return { ...DEFAULT_PREFS, ...(data.setting_value as any) } as NotificationPreferences;
    },
    enabled: !!accountId && !!userId,
    staleTime: 5 * 60 * 1000,
  });

  const saveSettings = useMutation({
    mutationFn: async (prefs: NotificationPreferences) => {
      if (!accountId || !userId) throw new Error('Not authenticated');

      // Check if exists
      const { data: existing } = await supabase
        .from('avivar_account_settings')
        .select('id')
        .eq('account_id', accountId)
        .eq('setting_key', settingKey)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('avivar_account_settings')
          .update({ setting_value: prefs as any, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('avivar_account_settings')
          .insert({
            account_id: accountId,
            setting_key: settingKey,
            setting_value: prefs as any,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avivar-notification-settings'] });
      toast.success('Preferências de notificação salvas!');
    },
    onError: () => toast.error('Erro ao salvar preferências'),
  });

  return { settings, isLoading, saveSettings };
}
