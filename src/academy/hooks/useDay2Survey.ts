import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Day2SurveyResponse {
  id: string;
  user_id: string;
  class_id: string | null;
  created_at: string;
  completed_at: string | null;
  is_completed: boolean;
  current_section: number;
  effective_time_seconds: number;
  
  // Questions
  q1_satisfaction_level: string | null;
  q2_joao_expectations: string | null;
  q3_joao_clarity: string | null;
  q4_joao_time: string | null;
  q5_joao_liked_most: string | null;
  q6_joao_improve: string | null;
  q7_larissa_expectations: string | null;
  q8_larissa_clarity: string | null;
  q9_larissa_time: string | null;
  q10_larissa_liked_most: string | null;
  q11_larissa_improve: string | null;
  q12_avivar_current_process: string | null;
  q13_avivar_opportunity_loss: string | null;
  q14_license_current_structure: string | null;
  q15_license_acceleration: string | null;
  q16_legal_current_structure: string | null;
  q17_legal_limitations: string | null;
  q18_timing_next_60_days: string | null;
  q19_timing_individual_interest: string | null;
  q20_insight_final: string | null;
  
  // Scores
  score_ia_avivar: number;
  score_license: number;
  score_legal: number;
  score_timing: number;
  score_total: number;
  lead_classification: string | null;
}

export type Day2SurveyFormData = Omit<Day2SurveyResponse, 
  'id' | 'user_id' | 'created_at' | 'completed_at' | 'is_completed' | 
  'score_ia_avivar' | 'score_license' | 'score_legal' | 'score_timing' | 
  'score_total' | 'lead_classification'
>;

export function useDay2Survey(classId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: existingSurvey, isLoading } = useQuery({
    queryKey: ['day2-survey', user?.id, classId],
    queryFn: async () => {
      if (!user?.id) return null;
      
      let query = supabase
        .from('day2_satisfaction_surveys')
        .select('*')
        .eq('user_id', user.id);
      
      if (classId) {
        query = query.eq('class_id', classId);
      }
      
      const { data, error } = await query.maybeSingle();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching day2 survey:', error);
        throw error;
      }
      
      return data as Day2SurveyResponse | null;
    },
    enabled: !!user?.id
  });

  const startSurvey = useMutation({
    mutationFn: async (classId?: string) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      // Check if survey already exists
      const { data: existing } = await supabase
        .from('day2_satisfaction_surveys')
        .select('id')
        .eq('user_id', user.id)
        .eq('class_id', classId || '')
        .maybeSingle();
      
      if (existing) {
        return existing;
      }
      
      const { data, error } = await supabase
        .from('day2_satisfaction_surveys')
        .insert({
          user_id: user.id,
          class_id: classId || null,
          current_section: 1
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['day2-survey'] });
    }
  });

  const saveProgress = useMutation({
    mutationFn: async ({ surveyId, data, currentSection }: { 
      surveyId: string; 
      data: Partial<Day2SurveyFormData>; 
      currentSection: number;
    }) => {
      const { error } = await supabase
        .from('day2_satisfaction_surveys')
        .update({
          ...data,
          current_section: currentSection
        })
        .eq('id', surveyId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['day2-survey'] });
    }
  });

  const submitSurvey = useMutation({
    mutationFn: async ({ surveyId, data, effectiveTime }: { 
      surveyId: string; 
      data: Partial<Day2SurveyFormData>;
      effectiveTime: number;
    }) => {
      const { error } = await supabase
        .from('day2_satisfaction_surveys')
        .update({
          ...data,
          is_completed: true,
          completed_at: new Date().toISOString(),
          effective_time_seconds: effectiveTime
        })
        .eq('id', surveyId);
      
      if (error) throw error;
      
      // Notify about survey completion
      try {
        await supabase.functions.invoke('notify-survey-completed', {
          body: { 
            surveyId, 
            classId: classId || null, 
            userId: user?.id,
            surveyType: 'day2'
          }
        });
      } catch (e) {
        console.warn('Failed to send notification:', e);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['day2-survey'] });
      toast.success('Pesquisa enviada com sucesso!');
    },
    onError: (error) => {
      console.error('Error submitting survey:', error);
      toast.error('Erro ao enviar pesquisa');
    }
  });

  return {
    existingSurvey,
    isLoading,
    isCompleted: existingSurvey?.is_completed ?? false,
    startSurvey,
    saveProgress,
    submitSurvey
  };
}

// Hook for admin to get all surveys with ranking
export function useDay2SurveyRanking(classId?: string) {
  return useQuery({
    queryKey: ['day2-survey-ranking', classId],
    queryFn: async () => {
      let query = supabase
        .from('day2_satisfaction_surveys')
        .select(`
          *,
          neohub_users!inner(full_name, email, avatar_url)
        `)
        .eq('is_completed', true)
        .order('score_total', { ascending: false });
      
      if (classId) {
        query = query.eq('class_id', classId);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching survey ranking:', error);
        throw error;
      }
      
      return data;
    }
  });
}
