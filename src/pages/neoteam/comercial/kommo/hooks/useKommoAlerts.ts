// ====================================
// useKommoAlerts - Hook para alertas e notificações
// ====================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface KommoAlertRule {
  id: string;
  name: string;
  description: string | null;
  alert_type: string;
  metric_key: string;
  condition: string;
  threshold_value: number;
  severity: string;
  is_active: boolean;
  notify_in_app: boolean;
  check_interval_minutes: number;
  last_triggered_at: string | null;
  created_at: string;
}

export interface KommoNotification {
  id: string;
  alert_rule_id: string | null;
  title: string;
  message: string;
  severity: string;
  metric_key: string | null;
  metric_value: number | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

const KEYS = {
  alertRules: ['kommo', 'alert-rules'] as const,
  notifications: ['kommo', 'notifications'] as const,
  unreadCount: ['kommo', 'notifications', 'unread'] as const,
};

export function useKommoAlertRules() {
  return useQuery({
    queryKey: KEYS.alertRules,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kommo_alert_rules')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as KommoAlertRule[];
    },
  });
}

export function useKommoNotifications(limit = 20) {
  return useQuery({
    queryKey: KEYS.notifications,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kommo_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data || []) as unknown as KommoNotification[];
    },
    refetchInterval: 30000, // Poll every 30s
  });
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: KEYS.unreadCount,
    queryFn: async () => {
      const { count, error } = await supabase
        .from('kommo_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false);
      if (error) throw error;
      return count || 0;
    },
    refetchInterval: 15000,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('kommo_notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kommo', 'notifications'] });
    },
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('kommo_notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('is_read', false);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kommo', 'notifications'] });
      toast.success('Todas as notificações marcadas como lidas');
    },
  });
}

export function useCreateAlertRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rule: Partial<KommoAlertRule>) => {
      const { data, error } = await supabase
        .from('kommo_alert_rules')
        .insert(rule as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.alertRules });
      toast.success('Regra de alerta criada');
    },
  });
}

export function useToggleAlertRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('kommo_alert_rules')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.alertRules });
    },
  });
}

export function useDeleteAlertRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('kommo_alert_rules')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.alertRules });
      toast.success('Regra de alerta removida');
    },
  });
}

// Check alerts against current data and create notifications
export function useCheckAlerts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (metrics: Record<string, number>) => {
      // Fetch active rules
      const { data: rules } = await supabase
        .from('kommo_alert_rules')
        .select('*')
        .eq('is_active', true);

      if (!rules || rules.length === 0) return { triggered: 0 };

      let triggered = 0;

      for (const rule of rules) {
        const value = metrics[rule.metric_key];
        if (value === undefined) continue;

        let shouldTrigger = false;
        switch (rule.condition) {
          case 'gt': shouldTrigger = value > rule.threshold_value; break;
          case 'lt': shouldTrigger = value < rule.threshold_value; break;
          case 'gte': shouldTrigger = value >= rule.threshold_value; break;
          case 'lte': shouldTrigger = value <= rule.threshold_value; break;
          case 'eq': shouldTrigger = value === rule.threshold_value; break;
        }

        if (shouldTrigger && rule.notify_in_app) {
          await supabase.from('kommo_notifications').insert({
            alert_rule_id: rule.id,
            title: rule.name,
            message: rule.description || `${rule.metric_key}: ${value} (threshold: ${rule.threshold_value})`,
            severity: rule.severity,
            metric_key: rule.metric_key,
            metric_value: value,
          });

          await supabase
            .from('kommo_alert_rules')
            .update({ last_triggered_at: new Date().toISOString() })
            .eq('id', rule.id);

          triggered++;
        }
      }

      return { triggered };
    },
    onSuccess: (data) => {
      if (data.triggered > 0) {
        qc.invalidateQueries({ queryKey: ['kommo', 'notifications'] });
      }
    },
  });
}
