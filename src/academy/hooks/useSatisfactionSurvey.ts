import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SurveyResponse {
  id: string;
  user_id: string;
  class_id: string | null;
  is_completed: boolean;
  started_at: string;
  completed_at: string | null;
  survey_version: number;
  
  // Block 1
  full_name: string | null;
  years_practicing: string | null;
  practice_format: string | null;
  
  // Block 2
  satisfaction_score: number | null;
  expectations_met: string | null;
  clarity_teachers: string | null;
  what_liked_most: string | null;
  what_could_improve: string | null;
  
  // Block 3
  evolution_path_clarity: string | null;
  knows_next_step: string | null;
  
  // Block 4
  professional_moment: string | null;
  priority_score: number | null;
  start_timeline: string | null;
  
  // Block 5
  weekly_hours: string | null;
  time_vs_money: string | null;
  investment_comfort: string | null;
  
  // Block 6
  future_vision_12m: string | null;
  success_result: string | null;
  
  // Block 7
  ai_relation: string | null;
  has_captation_plan: string | null;
  wants_individual_talk: string | null;
  
  // Block 8
  what_differentiates_best: string | null;
  memorable_phrase: string | null;
  
  // Lead classification
  lead_tags: string[];
  lead_score: number;
  is_priority_lead: boolean;
  
  current_block: number;
  partial_data: Record<string, unknown> | null;
}

export type SurveyFormData = Omit<SurveyResponse, 'id' | 'user_id' | 'started_at' | 'completed_at' | 'survey_version' | 'lead_tags' | 'lead_score' | 'is_priority_lead' | 'created_at' | 'updated_at'>;

// Calculate lead score and tags based on responses
function calculateLeadClassification(data: Partial<SurveyFormData>): { 
  tags: string[]; 
  score: number; 
  isPriority: boolean;
} {
  const tags: string[] = [];
  let score = 0;
  
  // Alta Fome: professional_moment = 'salto_nivel' or 'sozinho_dificil'
  if (data.professional_moment === 'salto_nivel' || data.professional_moment === 'sozinho_dificil') {
    tags.push('alta_fome');
    score += 20;
  }
  
  // Urgência Imediata: start_timeline = 'imediatamente' or '30_dias'
  if (data.start_timeline === 'imediatamente') {
    tags.push('urgencia_imediata');
    score += 25;
  } else if (data.start_timeline === '30_dias') {
    tags.push('urgencia_moderada');
    score += 15;
  }
  
  // Alto Investimento: investment_comfort = '5000_10000' or 'acima_10000'
  if (data.investment_comfort === 'acima_10000') {
    tags.push('alto_investimento');
    score += 30;
  } else if (data.investment_comfort === '5000_10000') {
    tags.push('investimento_moderado');
    score += 20;
  }
  
  // Muito Tempo Disponível: weekly_hours = '4_6' or 'mais_6'
  if (data.weekly_hours === 'mais_6') {
    tags.push('muito_tempo_disponivel');
    score += 15;
  } else if (data.weekly_hours === '4_6') {
    tags.push('tempo_moderado');
    score += 10;
  }
  
  // Priority score (1-10)
  if (data.priority_score && data.priority_score >= 8) {
    tags.push('alta_prioridade');
    score += data.priority_score * 2;
  }
  
  // Wants individual talk
  if (data.wants_individual_talk === 'sim') {
    tags.push('interesse_conversa');
    score += 20;
  }
  
  // Pronto para avançar
  if (data.evolution_path_clarity === 'pronto_avancar') {
    tags.push('pronto_avancar');
    score += 15;
  }
  
  // Has captation plan
  if (data.has_captation_plan === 'sim_claro') {
    tags.push('plano_estruturado');
    score += 10;
  }
  
  // Satisfaction
  if (data.satisfaction_score && data.satisfaction_score >= 9) {
    tags.push('promotor');
    score += 10;
  } else if (data.satisfaction_score && data.satisfaction_score <= 6) {
    tags.push('detrator');
  }
  
  // Determine if priority lead:
  // - Priority score >= 8
  // - Start timeline imediato
  // - Wants individual talk
  const isPriority = (
    (data.priority_score && data.priority_score >= 8) &&
    (data.start_timeline === 'imediatamente' || data.start_timeline === '30_dias') &&
    (data.wants_individual_talk === 'sim' || data.wants_individual_talk === 'talvez')
  );
  
  return { tags, score, isPriority: isPriority || false };
}

export function useSatisfactionSurvey(classId?: string) {
  const queryClient = useQueryClient();
  
  // Check if user has completed survey (global or for specific class)
  const { data: surveyResponse, isLoading, refetch } = useQuery({
    queryKey: ['satisfaction-survey', classId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      let query = supabase
        .from('satisfaction_survey_responses')
        .select('*')
        .eq('user_id', user.id);
      
      if (classId) {
        query = query.eq('class_id', classId);
      }
      
      const { data, error } = await query.maybeSingle();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching survey:', error);
        return null;
      }
      
      return data as SurveyResponse | null;
    },
  });
  
  const hasCompleted = surveyResponse?.is_completed ?? false;
  
  // Start or get existing survey
  const startSurveyMutation = useMutation({
    mutationFn: async (classIdToUse: string | null) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');
      
      // Check if already exists
      let query = supabase
        .from('satisfaction_survey_responses')
        .select('*')
        .eq('user_id', user.id);
      
      if (classIdToUse) {
        query = query.eq('class_id', classIdToUse);
      }
      
      const { data: existing } = await query.maybeSingle();
      
      if (existing) {
        return existing as SurveyResponse;
      }
      
      // Create new
      const { data, error } = await supabase
        .from('satisfaction_survey_responses')
        .insert({
          user_id: user.id,
          class_id: classIdToUse,
          current_block: 1,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as SurveyResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['satisfaction-survey'] });
    },
  });
  
  // Save partial progress
  const saveProgressMutation = useMutation({
    mutationFn: async ({ surveyId, data, currentBlock }: { 
      surveyId: string; 
      data: Partial<SurveyFormData>; 
      currentBlock: number;
    }) => {
      const { error } = await supabase
        .from('satisfaction_survey_responses')
        .update({
          ...data,
          current_block: currentBlock,
          partial_data: JSON.parse(JSON.stringify(data)),
        })
        .eq('id', surveyId);
      
      if (error) throw error;
    },
  });
  
  // Submit completed survey
  const submitSurveyMutation = useMutation({
    mutationFn: async ({ surveyId, data, effectiveTimeSeconds }: { 
      surveyId: string; 
      data: Partial<SurveyFormData>;
      effectiveTimeSeconds?: number;
    }) => {
      const { tags, score, isPriority } = calculateLeadClassification(data);
      
      // Remove partial_data from data to avoid type issues
      const { partial_data, ...cleanData } = data as Partial<SurveyFormData> & { partial_data?: unknown };
      
      const { error } = await supabase
        .from('satisfaction_survey_responses')
        .update({
          ...cleanData,
          is_completed: true,
          completed_at: new Date().toISOString(),
          lead_tags: tags,
          lead_score: score,
          is_priority_lead: isPriority,
          current_block: 9, // All blocks done
          partial_data: null, // Clear partial data
          effective_time_seconds: effectiveTimeSeconds || null, // Store effective time
        })
        .eq('id', surveyId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['satisfaction-survey'] });
      toast.success('Pesquisa concluída com sucesso! Agora você pode acessar as fotos.');
    },
    onError: (error) => {
      console.error('Error submitting survey:', error);
      toast.error('Erro ao enviar pesquisa. Tente novamente.');
    },
  });
  
  return {
    surveyResponse,
    hasCompleted,
    isLoading,
    refetch,
    startSurvey: startSurveyMutation.mutateAsync,
    saveProgress: saveProgressMutation.mutateAsync,
    submitSurvey: submitSurveyMutation.mutateAsync,
    isStarting: startSurveyMutation.isPending,
    isSaving: saveProgressMutation.isPending,
    isSubmitting: submitSurveyMutation.isPending,
  };
}
