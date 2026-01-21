import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface DailyMetric {
  id: string;
  clinic_id: string;
  metric_date: string;
  leads_novos: number;
  tempo_uso_atendente: number;
  atividades_atendente: number;
  atividades_robo: number;
  mensagens_enviadas_atendente: number;
  mensagens_enviadas_robo: number;
  mensagens_recebidas: number;
  tarefas_realizadas: number;
  tarefas_atrasadas: number;
  agendamentos: number;
  vendas_realizadas: number;
  leads_descartados: number;
  created_at: string;
  updated_at: string;
}

interface DateFilter {
  startDate: string;
  endDate: string;
}

export function useDailyMetrics(clinicId: string | undefined, filter?: DateFilter) {
  const queryClient = useQueryClient();

  const { data: dailyMetrics = [], isLoading, refetch } = useQuery({
    queryKey: ['daily-metrics', clinicId, filter?.startDate, filter?.endDate],
    queryFn: async () => {
      if (!clinicId) return [];

      let query = supabase
        .from('daily_metrics')
        .select('*')
        .eq('clinic_id', clinicId)
        .order('metric_date', { ascending: false });

      if (filter?.startDate) {
        query = query.gte('metric_date', filter.startDate);
      }
      if (filter?.endDate) {
        query = query.lte('metric_date', filter.endDate);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching daily metrics:', error);
        throw error;
      }

      return (data || []) as DailyMetric[];
    },
    enabled: !!clinicId,
  });

  const upsertMutation = useMutation({
    mutationFn: async ({ 
      date, 
      values 
    }: { 
      date: string; 
      values: Partial<Omit<DailyMetric, 'id' | 'clinic_id' | 'metric_date' | 'created_at' | 'updated_at'>> 
    }) => {
      if (!clinicId) throw new Error('No clinic selected');

      const { data, error } = await supabase
        .from('daily_metrics')
        .upsert({
          clinic_id: clinicId,
          metric_date: date,
          ...values,
        }, {
          onConflict: 'clinic_id,metric_date',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-metrics', clinicId] });
    },
    onError: (error) => {
      console.error('Error saving daily metric:', error);
      toast.error('Erro ao salvar métrica diária');
    },
  });

  const saveDailyMetric = async (date: string, values: Partial<Omit<DailyMetric, 'id' | 'clinic_id' | 'metric_date' | 'created_at' | 'updated_at'>>) => {
    return upsertMutation.mutateAsync({ date, values });
  };

  return {
    dailyMetrics,
    isLoading,
    refetch,
    saveDailyMetric,
    isSaving: upsertMutation.isPending,
  };
}
