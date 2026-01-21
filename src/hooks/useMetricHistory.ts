import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { subDays, format } from 'date-fns';
import { Json } from '@/integrations/supabase/types';

export interface MetricDataPoint {
  metric_key: string;
  metric_value: number;
  recorded_at: string;
  metadata?: Json;
}

export interface MetricSeries {
  key: string;
  name: string;
  color: string;
  data: { time: string; value: number }[];
}

const METRIC_CONFIG: Record<string, { name: string; color: string }> = {
  error_rate: { name: 'Taxa de Erro (%)', color: 'hsl(0, 84%, 60%)' },
  cache_hit_rate: { name: 'Cache Hit Rate (%)', color: 'hsl(142, 76%, 36%)' },
  avg_query_time: { name: 'Tempo de Query (ms)', color: 'hsl(211, 100%, 50%)' },
  active_users: { name: 'Usuários Ativos', color: 'hsl(262, 83%, 58%)' },
  slow_queries: { name: 'Queries Lentas', color: 'hsl(38, 92%, 50%)' },
  total_requests: { name: 'Total de Requests', color: 'hsl(180, 60%, 45%)' },
};

export function useMetricHistory(days: number = 7) {
  const [data, setData] = useState<MetricDataPoint[]>([]);
  const [series, setSeries] = useState<MetricSeries[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    try {
      setIsLoading(true);
      const startDate = subDays(new Date(), days);
      
      const { data: historyData, error } = await supabase
        .from('metric_history')
        .select('*')
        .gte('recorded_at', startDate.toISOString())
        .order('recorded_at', { ascending: true });

      if (error) throw error;

      const rawData: MetricDataPoint[] = (historyData || []).map(item => ({
        metric_key: item.metric_key,
        metric_value: Number(item.metric_value),
        recorded_at: item.recorded_at,
        metadata: item.metadata,
      }));
      setData(rawData);

      // Group by metric key
      const grouped: Record<string, { time: string; value: number }[]> = {};
      
      rawData.forEach(point => {
        if (!grouped[point.metric_key]) {
          grouped[point.metric_key] = [];
        }
        grouped[point.metric_key].push({
          time: format(new Date(point.recorded_at), 'dd/MM HH:mm'),
          value: Number(point.metric_value),
        });
      });

      // Convert to series format
      const seriesData: MetricSeries[] = Object.entries(grouped).map(([key, points]) => ({
        key,
        name: METRIC_CONFIG[key]?.name || key,
        color: METRIC_CONFIG[key]?.color || 'hsl(0, 0%, 50%)',
        data: points,
      }));

      setSeries(seriesData);
    } catch (error) {
      console.error('Error fetching metric history:', error);
    } finally {
      setIsLoading(false);
    }
  }, [days]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const recordMetric = useCallback(async (
    metricKey: string,
    value: number,
    metadata?: Record<string, unknown>
  ) => {
    try {
      const { error } = await supabase
        .from('metric_history')
        .insert([{
          metric_key: metricKey,
          metric_value: value,
          metadata: (metadata || {}) as Json,
        }]);

      if (error) throw error;
    } catch (error) {
      console.error('Error recording metric:', error);
    }
  }, []);

  return {
    data,
    series,
    isLoading,
    recordMetric,
    refetch: fetchHistory,
  };
}
