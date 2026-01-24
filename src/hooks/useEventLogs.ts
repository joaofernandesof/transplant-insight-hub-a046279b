import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface EventLog {
  id: string;
  user_id: string | null;
  user_name: string | null;
  user_email: string | null;
  event_type: string;
  event_category: string;
  event_name: string;
  module: string | null;
  page_path: string | null;
  metadata: Record<string, any>;
  ip_address: string | null;
  user_agent: string | null;
  session_id: string | null;
  created_at: string;
}

export interface EventLogsFilters {
  eventType?: string;
  eventCategory?: string;
  module?: string;
  userId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export function useEventLogs(filters: EventLogsFilters = {}, limit: number = 100) {
  return useQuery({
    queryKey: ['event-logs', filters, limit],
    queryFn: async (): Promise<EventLog[]> => {
      let query = supabase
        .from('system_event_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (filters.eventType) {
        query = query.eq('event_type', filters.eventType);
      }
      if (filters.eventCategory) {
        query = query.eq('event_category', filters.eventCategory);
      }
      if (filters.module) {
        query = query.eq('module', filters.module);
      }
      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }
      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate);
      }
      if (filters.search) {
        query = query.or(`event_name.ilike.%${filters.search}%,user_name.ilike.%${filters.search}%,user_email.ilike.%${filters.search}%,page_path.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching event logs:', error);
        throw error;
      }

      return (data || []) as EventLog[];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

export function useEventLogsStats() {
  return useQuery({
    queryKey: ['event-logs-stats'],
    queryFn: async () => {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const lastHour = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
      const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

      const [todayCount, lastHourCount, last24hCount, byTypeResult, byModuleResult] = await Promise.all([
        supabase.from('system_event_logs').select('id', { count: 'exact', head: true }).gte('created_at', today),
        supabase.from('system_event_logs').select('id', { count: 'exact', head: true }).gte('created_at', lastHour),
        supabase.from('system_event_logs').select('id', { count: 'exact', head: true }).gte('created_at', last24h),
        supabase.from('system_event_logs').select('event_type').gte('created_at', last24h),
        supabase.from('system_event_logs').select('module').gte('created_at', last24h).not('module', 'is', null),
      ]);

      // Count by type
      const byType: Record<string, number> = {};
      (byTypeResult.data || []).forEach((item: any) => {
        byType[item.event_type] = (byType[item.event_type] || 0) + 1;
      });

      // Count by module
      const byModule: Record<string, number> = {};
      (byModuleResult.data || []).forEach((item: any) => {
        if (item.module) {
          byModule[item.module] = (byModule[item.module] || 0) + 1;
        }
      });

      return {
        today: todayCount.count || 0,
        lastHour: lastHourCount.count || 0,
        last24h: last24hCount.count || 0,
        byType,
        byModule,
      };
    },
    refetchInterval: 60000, // Refresh every minute
  });
}
