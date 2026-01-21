import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface MetricAlert {
  id: string;
  metric_key: string;
  metric_name: string;
  threshold_value: number;
  comparison_operator: 'gt' | 'lt' | 'gte' | 'lte' | 'eq';
  severity: 'info' | 'warning' | 'critical';
  is_active: boolean;
  email_recipients: string[];
  last_triggered_at: string | null;
  cooldown_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface AlertHistory {
  id: string;
  alert_id: string | null;
  metric_key: string;
  metric_value: number;
  threshold_value: number;
  severity: string;
  emails_sent_to: string[];
  triggered_at: string;
}

export function useMetricAlerts() {
  const [alerts, setAlerts] = useState<MetricAlert[]>([]);
  const [history, setHistory] = useState<AlertHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAlerts = useCallback(async () => {
    try {
      setIsLoading(true);
      const [alertsRes, historyRes] = await Promise.all([
        supabase
          .from('metric_alerts')
          .select('*')
          .order('metric_name'),
        supabase
          .from('alert_history')
          .select('*')
          .order('triggered_at', { ascending: false })
          .limit(50),
      ]);

      if (alertsRes.error) throw alertsRes.error;
      if (historyRes.error) throw historyRes.error;

      setAlerts((alertsRes.data || []).map(a => ({
        ...a,
        comparison_operator: a.comparison_operator as MetricAlert['comparison_operator'],
        severity: a.severity as MetricAlert['severity'],
        email_recipients: a.email_recipients || [],
      })));
      setHistory(historyRes.data || []);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      toast.error('Erro ao carregar alertas');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const updateAlert = useCallback(async (
    alertId: string,
    updates: Partial<Pick<MetricAlert, 'threshold_value' | 'comparison_operator' | 'severity' | 'is_active' | 'email_recipients' | 'cooldown_minutes'>>
  ) => {
    try {
      const { error } = await supabase
        .from('metric_alerts')
        .update(updates)
        .eq('id', alertId);

      if (error) throw error;

      setAlerts(prev => prev.map(a => 
        a.id === alertId ? { ...a, ...updates } : a
      ));
      toast.success('Alerta atualizado!');
    } catch (error) {
      console.error('Error updating alert:', error);
      toast.error('Erro ao atualizar alerta');
    }
  }, []);

  const toggleAlert = useCallback(async (alertId: string) => {
    const alert = alerts.find(a => a.id === alertId);
    if (alert) {
      await updateAlert(alertId, { is_active: !alert.is_active });
    }
  }, [alerts, updateAlert]);

  const addRecipient = useCallback(async (alertId: string, email: string) => {
    const alert = alerts.find(a => a.id === alertId);
    if (alert && !alert.email_recipients.includes(email)) {
      await updateAlert(alertId, { 
        email_recipients: [...alert.email_recipients, email] 
      });
    }
  }, [alerts, updateAlert]);

  const removeRecipient = useCallback(async (alertId: string, email: string) => {
    const alert = alerts.find(a => a.id === alertId);
    if (alert) {
      await updateAlert(alertId, { 
        email_recipients: alert.email_recipients.filter(e => e !== email) 
      });
    }
  }, [alerts, updateAlert]);

  return {
    alerts,
    history,
    isLoading,
    updateAlert,
    toggleAlert,
    addRecipient,
    removeRecipient,
    refetch: fetchAlerts,
  };
}
