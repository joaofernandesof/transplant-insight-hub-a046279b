/**
 * Hooks for managing cadence sequences
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CadenceStep {
  id: string;
  sequence_id: string;
  step_order: number;
  channel: 'whatsapp' | 'sms' | 'email' | 'call';
  delay_minutes: number;
  message_template: string;
  subject?: string;
  is_active: boolean;
  created_at: string;
}

export interface CadenceSequence {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  trigger_type: 'no_response' | 'after_stage' | 'custom';
  trigger_stage?: string;
  is_active: boolean;
  is_template: boolean;
  template_category?: string;
  created_at: string;
  updated_at: string;
  steps?: CadenceStep[];
}

export interface CadenceExecution {
  id: string;
  sequence_id: string;
  journey_id?: string;
  lead_name: string;
  lead_phone?: string;
  lead_email?: string;
  current_step: number;
  status: 'active' | 'completed' | 'paused' | 'cancelled' | 'responded';
  started_at: string;
  next_step_at?: string;
  completed_at?: string;
  created_at: string;
  sequence?: CadenceSequence;
}

// Available variables for templates
export const TEMPLATE_VARIABLES = [
  { key: '{{nome}}', label: 'Nome do Lead', description: 'Nome completo do paciente/lead' },
  { key: '{{primeiro_nome}}', label: 'Primeiro Nome', description: 'Apenas o primeiro nome' },
  { key: '{{telefone}}', label: 'Telefone', description: 'Telefone do lead' },
  { key: '{{email}}', label: 'Email', description: 'Email do lead' },
  { key: '{{procedimento}}', label: 'Procedimento', description: 'Tipo de procedimento de interesse' },
  { key: '{{clinica}}', label: 'Nome da Clínica', description: 'Nome da sua clínica' },
  { key: '{{atendente}}', label: 'Nome do Atendente', description: 'Seu nome ou do atendente' },
  { key: '{{telefone_clinica}}', label: 'Telefone da Clínica', description: 'Telefone de contato' },
  { key: '{{data_consulta}}', label: 'Data da Consulta', description: 'Data agendada da consulta' },
  { key: '{{horario_consulta}}', label: 'Horário da Consulta', description: 'Horário agendado' },
  { key: '{{valor}}', label: 'Valor do Orçamento', description: 'Valor do procedimento' },
  { key: '{{desconto}}', label: 'Desconto Oferecido', description: 'Percentual de desconto' },
  { key: '{{link_agendamento}}', label: 'Link de Agendamento', description: 'Link para agendar online' },
];

export function useCadenceSequences() {
  return useQuery({
    queryKey: ['cadence-sequences'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('avivar_cadence_sequences')
        .select('*')
        .order('is_template', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as CadenceSequence[];
    }
  });
}

export function useCadenceSequenceWithSteps(sequenceId: string | null) {
  return useQuery({
    queryKey: ['cadence-sequence', sequenceId],
    queryFn: async () => {
      if (!sequenceId) return null;

      const { data: sequence, error: seqError } = await supabase
        .from('avivar_cadence_sequences')
        .select('*')
        .eq('id', sequenceId)
        .single();

      if (seqError) throw seqError;

      const { data: steps, error: stepsError } = await supabase
        .from('avivar_cadence_steps')
        .select('*')
        .eq('sequence_id', sequenceId)
        .order('step_order');

      if (stepsError) throw stepsError;

      return { ...sequence, steps } as CadenceSequence;
    },
    enabled: !!sequenceId
  });
}

export function useCreateCadence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      trigger_type: string;
      trigger_stage?: string;
      steps: Omit<CadenceStep, 'id' | 'sequence_id' | 'created_at'>[];
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Create sequence
      const { data: sequence, error: seqError } = await supabase
        .from('avivar_cadence_sequences')
        .insert({
          user_id: user.id,
          name: data.name,
          description: data.description,
          trigger_type: data.trigger_type,
          trigger_stage: data.trigger_stage,
          is_active: true,
          is_template: false
        })
        .select()
        .single();

      if (seqError) throw seqError;

      // Create steps
      if (data.steps.length > 0) {
        const { error: stepsError } = await supabase
          .from('avivar_cadence_steps')
          .insert(
            data.steps.map((step, index) => ({
              sequence_id: sequence.id,
              step_order: index + 1,
              channel: step.channel,
              delay_minutes: step.delay_minutes,
              message_template: step.message_template,
              subject: step.subject,
              is_active: true
            }))
          );

        if (stepsError) throw stepsError;
      }

      return sequence;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cadence-sequences'] });
      toast.success('Cadência criada com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao criar cadência: ' + error.message);
    }
  });
}

export function useCloneTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (templateId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Get template
      const { data: template, error: tplError } = await supabase
        .from('avivar_cadence_sequences')
        .select('*')
        .eq('id', templateId)
        .single();

      if (tplError) throw tplError;

      // Get template steps
      const { data: steps, error: stepsError } = await supabase
        .from('avivar_cadence_steps')
        .select('*')
        .eq('sequence_id', templateId)
        .order('step_order');

      if (stepsError) throw stepsError;

      // Create new sequence
      const { data: newSequence, error: newSeqError } = await supabase
        .from('avivar_cadence_sequences')
        .insert({
          user_id: user.id,
          name: `${template.name} (Cópia)`,
          description: template.description,
          trigger_type: template.trigger_type,
          trigger_stage: template.trigger_stage,
          is_active: true,
          is_template: false,
          template_category: template.template_category
        })
        .select()
        .single();

      if (newSeqError) throw newSeqError;

      // Clone steps
      if (steps && steps.length > 0) {
        const { error: newStepsError } = await supabase
          .from('avivar_cadence_steps')
          .insert(
            steps.map(step => ({
              sequence_id: newSequence.id,
              step_order: step.step_order,
              channel: step.channel,
              delay_minutes: step.delay_minutes,
              message_template: step.message_template,
              subject: step.subject,
              is_active: step.is_active
            }))
          );

        if (newStepsError) throw newStepsError;
      }

      return newSequence;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cadence-sequences'] });
      toast.success('Template copiado com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao copiar template: ' + error.message);
    }
  });
}

export function useUpdateCadence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<CadenceSequence> }) => {
      const { error } = await supabase
        .from('avivar_cadence_sequences')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cadence-sequences'] });
    }
  });
}

export function useDeleteCadence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('avivar_cadence_sequences')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cadence-sequences'] });
      toast.success('Cadência excluída!');
    },
    onError: (error: any) => {
      toast.error('Erro ao excluir: ' + error.message);
    }
  });
}

export function useCadenceExecutions() {
  return useQuery({
    queryKey: ['cadence-executions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('avivar_cadence_executions')
        .select(`
          *,
          sequence:avivar_cadence_sequences(name, trigger_type)
        `)
        .order('started_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as CadenceExecution[];
    }
  });
}

export function useStartCadence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      sequence_id: string;
      journey_id?: string;
      lead_name: string;
      lead_phone?: string;
      lead_email?: string;
    }) => {
      // Get first step delay
      const { data: steps } = await supabase
        .from('avivar_cadence_steps')
        .select('delay_minutes')
        .eq('sequence_id', data.sequence_id)
        .eq('step_order', 1)
        .single();

      const nextStepAt = new Date();
      nextStepAt.setMinutes(nextStepAt.getMinutes() + (steps?.delay_minutes || 30));

      const { data: execution, error } = await supabase
        .from('avivar_cadence_executions')
        .insert({
          ...data,
          current_step: 0,
          status: 'active',
          next_step_at: nextStepAt.toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return execution;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cadence-executions'] });
      toast.success('Cadência iniciada!');
    }
  });
}
