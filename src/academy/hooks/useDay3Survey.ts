import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Day3SurveyResponse {
  id: string;
  user_id: string;
  class_id: string | null;
  created_at: string;
  completed_at: string | null;
  is_completed: boolean;
  current_section: number;
  effective_time_seconds: number | null;
  
  // Satisfação e Promessa
  q1_satisfaction_level: string | null;
  q2_promise_met: string | null;
  
  // Conteúdo Técnico e Prático
  q3_technical_foundations: string | null;
  q4_practical_load: string | null;
  q5_theory_practice_balance: string | null;
  
  // Clareza, Execução e Confiança
  q6_execution_clarity: string | null;
  q7_confidence_level: string | null;
  
  // Gestão, Jurídico e Visão de Negócio
  q8_management_classes: string | null;
  q9_legal_security: string | null;
  
  // Experiência e Suporte
  q10_organization: string | null;
  q11_support_quality: string | null;
  
  // Diagnóstico (texto)
  q12_improvements: string | null;
  q13_highlights: string | null;
  
  // Avaliação dos Monitores
  q14_best_technical_monitor: string | null;
  q15_best_caring_monitor: string | null;
  q16_monitor_comments: string | null;
}

export type Day3SurveyFormData = Omit<Day3SurveyResponse, 'id' | 'user_id' | 'created_at' | 'completed_at'>;

export function useDay3Survey(classId?: string) {
  const queryClient = useQueryClient();
  
  const { data: surveyResponse, isLoading, refetch } = useQuery({
    queryKey: ['day3-survey', classId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      let query = supabase
        .from('day3_satisfaction_surveys')
        .select('*')
        .eq('user_id', user.id);
      
      if (classId) {
        query = query.eq('class_id', classId);
      }
      
      const { data, error } = await query.maybeSingle();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching day3 survey:', error);
        return null;
      }
      
      return data as Day3SurveyResponse | null;
    },
  });
  
  const hasCompleted = surveyResponse?.is_completed ?? false;
  
  const startSurveyMutation = useMutation({
    mutationFn: async (classIdToUse: string | null) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');
      
      let query = supabase
        .from('day3_satisfaction_surveys')
        .select('*')
        .eq('user_id', user.id);
      
      if (classIdToUse) {
        query = query.eq('class_id', classIdToUse);
      }
      
      const { data: existing } = await query.maybeSingle();
      
      if (existing) {
        return existing as Day3SurveyResponse;
      }
      
      const { data, error } = await supabase
        .from('day3_satisfaction_surveys')
        .insert({
          user_id: user.id,
          class_id: classIdToUse,
          current_section: 1,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as Day3SurveyResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['day3-survey'] });
    },
  });
  
  const saveProgressMutation = useMutation({
    mutationFn: async ({ surveyId, data, currentSection }: { 
      surveyId: string; 
      data: Partial<Day3SurveyFormData>; 
      currentSection: number;
    }) => {
      const { error } = await supabase
        .from('day3_satisfaction_surveys')
        .update({
          ...data,
          current_section: currentSection,
        })
        .eq('id', surveyId);
      
      if (error) throw error;
    },
  });
  
  const submitSurveyMutation = useMutation({
    mutationFn: async ({ surveyId, data, effectiveTimeSeconds }: { 
      surveyId: string; 
      data: Partial<Day3SurveyFormData>;
      effectiveTimeSeconds?: number;
    }) => {
      const { error } = await supabase
        .from('day3_satisfaction_surveys')
        .update({
          ...data,
          is_completed: true,
          completed_at: new Date().toISOString(),
          current_section: 6,
          effective_time_seconds: effectiveTimeSeconds || null,
        })
        .eq('id', surveyId);
      
      if (error) throw error;
      
      // Send notification email
      try {
        const { data: { user } } = await supabase.auth.getUser();
        await supabase.functions.invoke('send-day3-survey-notification', {
          body: { surveyId, userId: user?.id }
        });
      } catch (emailError) {
        console.error('Error sending notification:', emailError);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['day3-survey'] });
      toast.success('Pesquisa concluída com sucesso!');
    },
    onError: (error) => {
      console.error('Error submitting day3 survey:', error);
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
