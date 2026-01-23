import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Day1SurveyData {
  id: string;
  user_id: string;
  class_id: string | null;
  created_at: string;
  completed_at: string | null;
  is_completed: boolean;
  current_section: number;
  
  // Q1-2
  q1_satisfaction_level: string | null;
  q2_first_time_course: boolean | null;
  
  // Q3-7
  q3_hygor_expectations: string | null;
  q4_hygor_clarity: string | null;
  q5_hygor_time: string | null;
  q6_hygor_liked_most: string | null;
  q7_hygor_improve: string | null;
  
  // Q8-12
  q8_patrick_expectations: string | null;
  q9_patrick_clarity: string | null;
  q10_patrick_time: string | null;
  q11_patrick_liked_most: string | null;
  q12_patrick_improve: string | null;
  
  // Q13-20
  q13_organization: string | null;
  q14_content_relevance: string | null;
  q15_teacher_competence: string | null;
  q16_material_quality: string | null;
  q17_punctuality: string | null;
  q18_infrastructure: string | null;
  q19_support_team: string | null;
  q20_coffee_break: string | null;
  
  // Q21-22
  q21_liked_most_today: string | null;
  q22_suggestions: string | null;
  
  // Q23-28
  q23_start_preference: string | null;
  q24_hunger_level: string | null;
  q25_urgency_level: string | null;
  q26_investment_level: string | null;
  q27_weekly_time: string | null;
  q28_current_reality: string | null;
  
  // Q29-37
  q29_monitor_name: string | null;
  q30_monitor_technical: string | null;
  q31_monitor_interest: string | null;
  q32_monitor_engagement: string | null;
  q33_monitor_posture: string | null;
  q34_monitor_communication: string | null;
  q35_monitor_contribution: string | null;
  q36_monitor_strength: string | null;
  q37_monitor_improve: string | null;
}

export type Day1SurveyFormData = Omit<Day1SurveyData, 'id' | 'user_id' | 'created_at' | 'completed_at'>;

export function useDay1Survey(classId?: string) {
  const queryClient = useQueryClient();
  
  const { data: surveyResponse, isLoading, refetch } = useQuery({
    queryKey: ['day1-survey', classId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      let query = supabase
        .from('day1_satisfaction_surveys')
        .select('*')
        .eq('user_id', user.id);
      
      if (classId) {
        query = query.eq('class_id', classId);
      }
      
      const { data, error } = await query.maybeSingle();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching day1 survey:', error);
        return null;
      }
      
      return data as Day1SurveyData | null;
    },
  });
  
  const hasCompleted = surveyResponse?.is_completed ?? false;
  
  const startSurveyMutation = useMutation({
    mutationFn: async (classIdToUse: string | null) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');
      
      let query = supabase
        .from('day1_satisfaction_surveys')
        .select('*')
        .eq('user_id', user.id);
      
      if (classIdToUse) {
        query = query.eq('class_id', classIdToUse);
      }
      
      const { data: existing } = await query.maybeSingle();
      
      if (existing) {
        return existing as Day1SurveyData;
      }
      
      const { data, error } = await supabase
        .from('day1_satisfaction_surveys')
        .insert({
          user_id: user.id,
          class_id: classIdToUse,
          current_section: 1,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as Day1SurveyData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['day1-survey'] });
    },
  });
  
  const saveProgressMutation = useMutation({
    mutationFn: async ({ surveyId, data, currentSection }: { 
      surveyId: string; 
      data: Partial<Day1SurveyFormData>; 
      currentSection: number;
    }) => {
      const { error } = await supabase
        .from('day1_satisfaction_surveys')
        .update({
          ...data,
          current_section: currentSection,
        })
        .eq('id', surveyId);
      
      if (error) throw error;
    },
  });
  
  const submitSurveyMutation = useMutation({
    mutationFn: async ({ surveyId, data }: { 
      surveyId: string; 
      data: Partial<Day1SurveyFormData>;
    }) => {
      const { error } = await supabase
        .from('day1_satisfaction_surveys')
        .update({
          ...data,
          is_completed: true,
          completed_at: new Date().toISOString(),
          current_section: 8,
        })
        .eq('id', surveyId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['day1-survey'] });
      toast.success('Pesquisa do Dia 1 concluída com sucesso!');
    },
    onError: (error) => {
      console.error('Error submitting day1 survey:', error);
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
