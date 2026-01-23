-- Create table for Day 1 Satisfaction Survey
CREATE TABLE public.day1_satisfaction_surveys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  class_id UUID REFERENCES public.course_classes(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  is_completed BOOLEAN DEFAULT false,
  
  -- Q1-2: Satisfação Geral
  q1_satisfaction_level TEXT,
  q2_first_time_course BOOLEAN,
  
  -- Q3-7: Aula Dr. Hygor Guerreiro
  q3_hygor_expectations TEXT,
  q4_hygor_clarity TEXT,
  q5_hygor_time TEXT,
  q6_hygor_liked_most TEXT,
  q7_hygor_improve TEXT,
  
  -- Q8-12: Aula Dr. Patrick Penaforte
  q8_patrick_expectations TEXT,
  q9_patrick_clarity TEXT,
  q10_patrick_time TEXT,
  q11_patrick_liked_most TEXT,
  q12_patrick_improve TEXT,
  
  -- Q13-20: Avaliação Geral do Evento
  q13_organization TEXT,
  q14_content_relevance TEXT,
  q15_teacher_competence TEXT,
  q16_material_quality TEXT,
  q17_punctuality TEXT,
  q18_infrastructure TEXT,
  q19_support_team TEXT,
  q20_coffee_break TEXT,
  
  -- Q21-22: Feedback Aberto
  q21_liked_most_today TEXT,
  q22_suggestions TEXT,
  
  -- Q23-28: Diagnóstico de Início
  q23_start_preference TEXT,
  q24_hunger_level TEXT,
  q25_urgency_level TEXT,
  q26_investment_level TEXT,
  q27_weekly_time TEXT,
  q28_current_reality TEXT,
  
  -- Q29-37: Avaliação dos Monitores
  q29_monitor_name TEXT,
  q30_monitor_technical TEXT,
  q31_monitor_interest TEXT,
  q32_monitor_engagement TEXT,
  q33_monitor_posture TEXT,
  q34_monitor_communication TEXT,
  q35_monitor_contribution TEXT,
  q36_monitor_strength TEXT,
  q37_monitor_improve TEXT,
  
  -- Metadata
  current_section INTEGER DEFAULT 1
);

-- Enable RLS
ALTER TABLE public.day1_satisfaction_surveys ENABLE ROW LEVEL SECURITY;

-- Users can view their own surveys
CREATE POLICY "Users can view own day1 surveys" 
ON public.day1_satisfaction_surveys 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can insert their own surveys
CREATE POLICY "Users can insert own day1 surveys" 
ON public.day1_satisfaction_surveys 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own surveys
CREATE POLICY "Users can update own day1 surveys" 
ON public.day1_satisfaction_surveys 
FOR UPDATE 
USING (auth.uid() = user_id);