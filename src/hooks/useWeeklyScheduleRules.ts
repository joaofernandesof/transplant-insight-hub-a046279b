import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface WeeklyScheduleRule {
  id: string;
  cidade: string;
  semana_do_mes: number;
  tipo: string;
  categoria: string | null;
  medico: string | null;
  permitido: boolean;
  created_at: string;
  updated_at: string;
}

export const CIDADES = ['Fortaleza', 'Juazeiro', 'São Paulo'] as const;
export const MEDICOS = ['Hygor', 'Patrick', 'Márcia'] as const;
export const TIPOS_AGENDAMENTO = ['consulta', 'transplante', 'retorno'] as const;
export const CATEGORIAS_RODIZIO: Record<string, string[]> = {
  'Fortaleza': ['AAA', 'AH', 'AP', 'B', 'C'],
  'Juazeiro': ['AP', 'B', 'C'],
  'São Paulo': ['AH', 'B', 'C'],
};

export function getSemanaDOMes(date: Date): number {
  const day = date.getDate();
  if (day <= 7) return 1;
  if (day <= 14) return 2;
  if (day <= 21) return 3;
  return 4;
}

export function getMedicoResponsavel(rules: WeeklyScheduleRule[], cidade: string, semana: number): string | null {
  const consultaRules = rules.filter(
    r => r.cidade === cidade && r.semana_do_mes === semana && r.tipo === 'consulta' && r.permitido && r.medico
  );
  return consultaRules.length === 1 ? consultaRules[0].medico : consultaRules.map(r => r.medico).join(', ') || null;
}

export function useWeeklyScheduleRules() {
  const queryClient = useQueryClient();

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['weekly-schedule-rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('weekly_schedule_rules')
        .select('*')
        .order('cidade')
        .order('semana_do_mes')
        .order('tipo');

      if (error) throw error;
      return data as WeeklyScheduleRule[];
    },
  });

  const updateRule = useMutation({
    mutationFn: async ({ id, permitido }: { id: string; permitido: boolean }) => {
      const { error } = await supabase
        .from('weekly_schedule_rules')
        .update({ permitido, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekly-schedule-rules'] });
      toast.success('Regra atualizada!');
    },
    onError: () => toast.error('Erro ao atualizar regra'),
  });

  return { rules, isLoading, updateRule };
}

export function useValidateScheduleRotation() {
  const { user } = useAuth();

  const validate = async (params: {
    cidade: string;
    surgery_date: string;
    tipo: string;
    categoria?: string;
    medico?: string;
  }): Promise<{ permitido: boolean; semana_do_mes: number; mensagem: string }> => {
    const { data, error } = await supabase.rpc('validate_schedule_rotation', {
      p_cidade: params.cidade,
      p_date: params.surgery_date,
      p_tipo: params.tipo,
      p_categoria: params.categoria || null,
      p_medico: params.medico || null,
    });

    if (error) {
      console.error('Validation error:', error);
      return { permitido: true, semana_do_mes: 0, mensagem: 'Erro na validação' };
    }

    const result = data as { permitido: boolean; semana_do_mes: number; mensagem: string };

    // Log blocked attempt
    if (!result.permitido && user?.id) {
      await supabase.from('schedule_block_logs').insert({
        user_id: user.id,
        cidade: params.cidade,
        semana_do_mes: result.semana_do_mes,
        tipo: params.tipo,
        categoria: params.categoria || null,
        medico: params.medico || null,
        surgery_date: params.surgery_date,
        blocked_reason: result.mensagem,
      });
    }

    return result;
  };

  return { validate };
}
