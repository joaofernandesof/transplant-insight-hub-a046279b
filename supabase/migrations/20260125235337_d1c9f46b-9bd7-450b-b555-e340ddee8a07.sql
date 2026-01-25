-- Create day3_satisfaction_surveys table
CREATE TABLE public.day3_satisfaction_surveys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.course_classes(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  is_completed BOOLEAN DEFAULT false,
  current_section INTEGER DEFAULT 1,
  effective_time_seconds INTEGER,
  
  -- Satisfação e Promessa
  q1_satisfaction_level TEXT, -- muito_insatisfeito, insatisfeito, neutro, satisfeito, muito_satisfeito
  q2_promise_met TEXT, -- muito_abaixo, abaixo, dentro, acima, muito_acima
  
  -- Conteúdo Técnico e Prático
  q3_technical_foundations TEXT, -- muito_fracos, fracos, adequados, bons, excelentes
  q4_practical_load TEXT, -- muito_insuficiente, insuficiente, adequada, boa, excelente
  q5_theory_practice_balance TEXT, -- muito_teorico, mais_teoria, equilibrado, mais_pratica, muito_pratico
  
  -- Clareza, Execução e Confiança
  q6_execution_clarity TEXT, -- nenhuma, pouca, razoavel, boa, total
  q7_confidence_level TEXT, -- nenhuma, baixa, moderada, boa, alta
  
  -- Gestão, Jurídico e Visão de Negócio
  q8_management_classes TEXT, -- nada_relevantes, pouco_relevantes, relevantes, muito_relevantes, essenciais
  q9_legal_security TEXT, -- nenhuma, pouca, razoavel, boa, muita
  
  -- Experiência e Suporte
  q10_organization TEXT, -- muito_ruim, ruim, regular, boa, excelente
  q11_support_quality TEXT, -- muito_fraco, fraco, adequado, bom, excelente
  
  -- Diagnóstico (texto)
  q12_improvements TEXT,
  q13_highlights TEXT,
  
  -- Avaliação dos Monitores
  q14_best_technical_monitor TEXT, -- elenilton, patrick, eder, gleyldes
  q15_best_caring_monitor TEXT, -- elenilton, patrick, eder, gleyldes
  q16_monitor_comments TEXT
);

-- Enable RLS
ALTER TABLE public.day3_satisfaction_surveys ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own day3 surveys"
ON public.day3_satisfaction_surveys FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own day3 surveys"
ON public.day3_satisfaction_surveys FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own day3 surveys"
ON public.day3_satisfaction_surveys FOR UPDATE
USING (auth.uid() = user_id);

-- Admin access
CREATE POLICY "Admins can view all day3 surveys"
ON public.day3_satisfaction_surveys FOR SELECT
USING (public.is_neohub_admin(auth.uid()));

CREATE POLICY "Admins can update all day3 surveys"
ON public.day3_satisfaction_surveys FOR UPDATE
USING (public.is_neohub_admin(auth.uid()));

-- Index for performance
CREATE INDEX idx_day3_surveys_user_id ON public.day3_satisfaction_surveys(user_id);
CREATE INDEX idx_day3_surveys_class_id ON public.day3_satisfaction_surveys(class_id);
CREATE INDEX idx_day3_surveys_completed ON public.day3_satisfaction_surveys(is_completed);