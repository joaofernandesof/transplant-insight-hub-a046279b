import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useEffect } from 'react';

// Types
export interface MonitoredSystem {
  id: string;
  name: string;
  type: 'webhook' | 'api' | 'domain' | 'integration';
  url: string | null;
  description: string | null;
  check_interval_seconds: number;
  timeout_ms: number;
  expected_status_codes: number[];
  headers: Record<string, string>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Computed from latest health check
  status?: 'healthy' | 'warning' | 'critical' | 'unknown';
  last_check?: string;
  response_time_ms?: number;
  uptime_percentage?: number;
  error_count_24h?: number;
}

export interface SystemAlert {
  id: string;
  system_id: string;
  severity: 'high' | 'medium' | 'low';
  type: 'downtime' | 'ssl' | 'webhook_fail' | 'slow_response' | 'error';
  message: string;
  details: Record<string, unknown>;
  resolved: boolean;
  resolved_at: string | null;
  notified_via: string[];
  created_at: string;
  // Joined
  system_name?: string;
}

export interface WhatsAppConfig {
  id: string;
  instance_url: string;
  api_token: string;
  phone_number: string;
  is_connected: boolean;
  last_test_at: string | null;
  notify_high: boolean;
  notify_medium: boolean;
  notify_low: boolean;
  notify_daily_summary: boolean;
  daily_summary_hour: number;
}

export interface AlertRecipient {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  receive_whatsapp: boolean;
  receive_email: boolean;
  severity_filter: string[];
  is_active: boolean;
}

export interface SystemHealthCheck {
  id: string;
  system_id: string;
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
  response_time_ms: number | null;
  status_code: number | null;
  error_message: string | null;
  checked_at: string;
}

// Fetch monitored systems with latest health data
export function useMonitoredSystems() {
  const { isAdmin } = useAuth();

  return useQuery({
    queryKey: ['sentinel', 'systems'],
    queryFn: async (): Promise<MonitoredSystem[]> => {
      // Fetch systems
      const { data: systems, error } = await supabase
        .from('monitored_systems')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      if (!systems) return [];

      // Fetch latest health check for each system
      const systemsWithHealth = await Promise.all(
        systems.map(async (system) => {
          // Get latest health check
          const { data: healthCheck } = await supabase
            .from('system_health_checks')
            .select('*')
            .eq('system_id', system.id)
            .order('checked_at', { ascending: false })
            .limit(1)
            .single();

          // Get error count in last 24h
          const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
          const { count: errorCount } = await supabase
            .from('system_health_checks')
            .select('*', { count: 'exact', head: true })
            .eq('system_id', system.id)
            .in('status', ['warning', 'critical'])
            .gte('checked_at', yesterday);

          // Calculate uptime (last 24h)
          const { count: totalChecks } = await supabase
            .from('system_health_checks')
            .select('*', { count: 'exact', head: true })
            .eq('system_id', system.id)
            .gte('checked_at', yesterday);

          const { count: successfulChecks } = await supabase
            .from('system_health_checks')
            .select('*', { count: 'exact', head: true })
            .eq('system_id', system.id)
            .eq('status', 'healthy')
            .gte('checked_at', yesterday);

          const uptimePercentage = totalChecks && totalChecks > 0
            ? ((successfulChecks || 0) / totalChecks) * 100
            : 100;

          return {
            ...system,
            status: healthCheck?.status || 'unknown',
            last_check: healthCheck?.checked_at,
            response_time_ms: healthCheck?.response_time_ms,
            uptime_percentage: uptimePercentage,
            error_count_24h: errorCount || 0,
          } as MonitoredSystem;
        })
      );

      return systemsWithHealth;
    },
    enabled: isAdmin,
    refetchInterval: 30000, // Refresh every 30s
  });
}

// Fetch system alerts
export function useSystemAlerts(options?: { resolved?: boolean }) {
  const { isAdmin } = useAuth();

  return useQuery({
    queryKey: ['sentinel', 'alerts', options],
    queryFn: async (): Promise<SystemAlert[]> => {
      let query = supabase
        .from('system_alerts')
        .select(`
          *,
          monitored_systems!inner(name)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (options?.resolved !== undefined) {
        query = query.eq('resolved', options.resolved);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((alert: any) => ({
        ...alert,
        system_name: alert.monitored_systems?.name,
      }));
    },
    enabled: isAdmin,
  });
}

// Fetch WhatsApp config
export function useWhatsAppConfig() {
  const { isAdmin } = useAuth();

  return useQuery({
    queryKey: ['sentinel', 'whatsapp-config'],
    queryFn: async (): Promise<WhatsAppConfig | null> => {
      const { data, error } = await supabase
        .from('sentinel_whatsapp_config')
        .select('*')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: isAdmin,
  });
}

// Fetch alert recipients
export function useAlertRecipients() {
  const { isAdmin } = useAuth();

  return useQuery({
    queryKey: ['sentinel', 'recipients'],
    queryFn: async (): Promise<AlertRecipient[]> => {
      const { data, error } = await supabase
        .from('sentinel_alert_recipients')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    },
    enabled: isAdmin,
  });
}

// Mutations
export function useSentinelMutations() {
  const queryClient = useQueryClient();

  // Add new system
  const addSystem = useMutation({
    mutationFn: async (system: Partial<MonitoredSystem>) => {
      const { data, error } = await supabase
        .from('monitored_systems')
        .insert([system as any])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sentinel', 'systems'] });
      toast.success('Sistema adicionado com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao adicionar sistema: ' + error.message);
    },
  });

  // Update system
  const updateSystem = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<MonitoredSystem> & { id: string }) => {
      const { data, error } = await supabase
        .from('monitored_systems')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sentinel', 'systems'] });
      toast.success('Sistema atualizado');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar: ' + error.message);
    },
  });

  // Delete system
  const deleteSystem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('monitored_systems')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sentinel', 'systems'] });
      toast.success('Sistema removido');
    },
    onError: (error) => {
      toast.error('Erro ao remover: ' + error.message);
    },
  });

  // Resolve alert
  const resolveAlert = useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from('system_alerts')
        .update({ 
          resolved: true, 
          resolved_at: new Date().toISOString() 
        })
        .eq('id', alertId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sentinel', 'alerts'] });
      toast.success('Alerta resolvido');
    },
    onError: (error) => {
      toast.error('Erro ao resolver alerta: ' + error.message);
    },
  });

  // Save WhatsApp config
  const saveWhatsAppConfig = useMutation({
    mutationFn: async (config: Partial<WhatsAppConfig>) => {
      // Check if config exists
      const { data: existing } = await supabase
        .from('sentinel_whatsapp_config')
        .select('id')
        .limit(1)
        .single();

      if (existing) {
        const { error } = await supabase
          .from('sentinel_whatsapp_config')
          .update(config as any)
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('sentinel_whatsapp_config')
          .insert([config as any]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sentinel', 'whatsapp-config'] });
      toast.success('Configurações salvas');
    },
    onError: (error) => {
      toast.error('Erro ao salvar: ' + error.message);
    },
  });

  // Test WhatsApp
  const testWhatsApp = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('sentinel-whatsapp', {
        body: { action: 'test' },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Mensagem de teste enviada!');
    },
    onError: (error) => {
      toast.error('Erro ao enviar teste: ' + error.message);
    },
  });

  // Manual health check
  const runHealthCheck = useMutation({
    mutationFn: async (systemId?: string) => {
      const { data, error } = await supabase.functions.invoke('sentinel-check', {
        body: { systemId },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sentinel', 'systems'] });
      queryClient.invalidateQueries({ queryKey: ['sentinel', 'alerts'] });
      toast.success('Verificação concluída');
    },
    onError: (error) => {
      toast.error('Erro na verificação: ' + error.message);
    },
  });

  return {
    addSystem,
    updateSystem,
    deleteSystem,
    resolveAlert,
    saveWhatsAppConfig,
    testWhatsApp,
    runHealthCheck,
  };
}

// Real-time alerts subscription
export function useRealtimeAlerts(onNewAlert: (alert: SystemAlert) => void) {
  useEffect(() => {
    const channel = supabase
      .channel('sentinel-alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'system_alerts',
        },
        (payload) => {
          onNewAlert(payload.new as SystemAlert);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onNewAlert]);
}

// Aggregated stats
export function useSentinelStats() {
  const { data: systems } = useMonitoredSystems();
  const { data: alerts } = useSystemAlerts({ resolved: false });

  const stats = {
    totalSystems: systems?.length || 0,
    healthySystems: systems?.filter(s => s.status === 'healthy').length || 0,
    warningSystems: systems?.filter(s => s.status === 'warning').length || 0,
    criticalSystems: systems?.filter(s => s.status === 'critical').length || 0,
    activeAlerts: alerts?.length || 0,
    highAlerts: alerts?.filter(a => a.severity === 'high').length || 0,
    avgUptime: systems?.length
      ? systems.reduce((acc, s) => acc + (s.uptime_percentage || 0), 0) / systems.length
      : 100,
  };

  return stats;
}
