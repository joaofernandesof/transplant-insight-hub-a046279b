-- Create Day 2 Satisfaction Survey table with automatic scoring
CREATE TABLE public.day2_satisfaction_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.course_classes(id) ON DELETE SET NULL,
  
  -- Survey metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  is_completed BOOLEAN DEFAULT false,
  current_section INTEGER DEFAULT 1,
  effective_time_seconds INTEGER DEFAULT 0,
  
  -- Q1: Satisfação Geral
  q1_satisfaction_level TEXT,
  
  -- Q2-Q6: Aula João Fernandes
  q2_joao_expectations TEXT,
  q3_joao_clarity TEXT,
  q4_joao_time TEXT,
  q5_joao_liked_most TEXT,
  q6_joao_improve TEXT,
  
  -- Q7-Q11: Aula Larissa Guerreiro
  q7_larissa_expectations TEXT,
  q8_larissa_clarity TEXT,
  q9_larissa_time TEXT,
  q10_larissa_liked_most TEXT,
  q11_larissa_improve TEXT,
  
  -- Q12-Q13: IA Avivar
  q12_avivar_current_process TEXT,
  q13_avivar_opportunity_loss TEXT,
  
  -- Q14-Q15: Licença ByNeofolic
  q14_license_current_structure TEXT,
  q15_license_acceleration TEXT,
  
  -- Q16-Q17: Assessoria Jurídica
  q16_legal_current_structure TEXT,
  q17_legal_limitations TEXT,
  
  -- Q18-Q19: Timing e Decisão
  q18_timing_next_60_days TEXT,
  q19_timing_individual_interest TEXT,
  
  -- Q20: Insight Final
  q20_insight_final TEXT,
  
  -- Calculated Scores
  score_ia_avivar INTEGER DEFAULT 0,
  score_license INTEGER DEFAULT 0,
  score_legal INTEGER DEFAULT 0,
  score_timing INTEGER DEFAULT 0,
  score_total INTEGER DEFAULT 0,
  
  -- Lead Classification
  lead_classification TEXT, -- 'hot', 'warm', 'cold'
  
  UNIQUE(user_id, class_id)
);

-- Enable RLS
ALTER TABLE public.day2_satisfaction_surveys ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can insert own day2 surveys"
ON public.day2_satisfaction_surveys FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own day2 surveys"
ON public.day2_satisfaction_surveys FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can view own day2 surveys"
ON public.day2_satisfaction_surveys FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all day2 surveys"
ON public.day2_satisfaction_surveys FOR SELECT
USING (is_neohub_admin(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Colaboradores can view all day2 surveys"
ON public.day2_satisfaction_surveys FOR SELECT
USING (EXISTS (
  SELECT 1 FROM neohub_user_profiles nup
  WHERE nup.neohub_user_id = (SELECT nu.id FROM neohub_users nu WHERE nu.user_id = auth.uid())
  AND nup.profile = 'colaborador'
  AND nup.is_active = true
));

-- Create function to calculate Day 2 scores
CREATE OR REPLACE FUNCTION public.calculate_day2_scores()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_score_ia INTEGER := 0;
  v_score_license INTEGER := 0;
  v_score_legal INTEGER := 0;
  v_score_timing INTEGER := 0;
  v_score_total INTEGER := 0;
  v_classification TEXT;
BEGIN
  -- Calculate IA Avivar Score (Q12 + Q13)
  -- Option mapping: 1=0, 2=2, 3=4, 4=6
  v_score_ia := CASE NEW.q12_avivar_current_process
    WHEN 'Tudo manual, depende de pessoas' THEN 0
    WHEN 'Uso WhatsApp, mas sem padrão definido' THEN 2
    WHEN 'Tenho algum sistema, mas é pouco eficiente' THEN 4
    WHEN 'Tenho processo estruturado e quero automatizar para escalar' THEN 6
    ELSE 0
  END;
  
  v_score_ia := v_score_ia + CASE NEW.q13_avivar_opportunity_loss
    WHEN 'Não sinto que perco oportunidades' THEN 0
    WHEN 'Perco poucas oportunidades' THEN 2
    WHEN 'Perco bastante, mas consigo lidar' THEN 4
    WHEN 'Perco muitas oportunidades e isso trava meu crescimento' THEN 6
    ELSE 0
  END;
  
  -- Calculate License Score (Q14 + Q15)
  v_score_license := CASE NEW.q14_license_current_structure
    WHEN 'Tudo foi construído sozinho, sem modelo' THEN 0
    WHEN 'Tenho referências, mas adaptei por conta própria' THEN 2
    WHEN 'Sigo parcialmente um modelo validado' THEN 4
    WHEN 'Opero ou quero operar com um modelo testado e acompanhado' THEN 6
    ELSE 0
  END;
  
  v_score_license := v_score_license + CASE NEW.q15_license_acceleration
    WHEN 'Não faria diferença' THEN 0
    WHEN 'Ajudaria um pouco' THEN 2
    WHEN 'Ajudaria bastante' THEN 4
    WHEN 'Seria decisivo para crescer mais rápido' THEN 6
    ELSE 0
  END;
  
  -- Calculate Legal Score (Q16 + Q17) - INVERTED scoring
  v_score_legal := CASE NEW.q16_legal_current_structure
    WHEN 'Não tenho praticamente nada estruturado' THEN 6
    WHEN 'Tenho contratos básicos e termos genéricos' THEN 4
    WHEN 'Tenho estrutura razoável, mas com inseguranças' THEN 2
    WHEN 'Tenho tudo estruturado e revisado por especialista' THEN 0
    ELSE 0
  END;
  
  v_score_legal := v_score_legal + CASE NEW.q17_legal_limitations
    WHEN 'Não limitam' THEN 0
    WHEN 'Limitam um pouco' THEN 2
    WHEN 'Limitam bastante' THEN 4
    WHEN 'São um risco real para minha operação' THEN 6
    ELSE 0
  END;
  
  -- Calculate Timing Score (Q18 + Q19)
  v_score_timing := CASE NEW.q18_timing_next_60_days
    WHEN 'Estou apenas absorvendo conhecimento' THEN 0
    WHEN 'Quero estruturar com calma' THEN 2
    WHEN 'Quero acelerar com apoio certo' THEN 4
    WHEN 'Quero avançar agora' THEN 6
    ELSE 0
  END;
  
  v_score_timing := v_score_timing + CASE NEW.q19_timing_individual_interest
    WHEN 'Não' THEN 0
    WHEN 'Talvez mais para frente' THEN 2
    WHEN 'Sim, quero entender melhor' THEN 4
    WHEN 'Sim, quero avançar nisso agora' THEN 6
    ELSE 0
  END;
  
  -- Calculate total score
  v_score_total := v_score_ia + v_score_license + v_score_legal + v_score_timing;
  
  -- Determine classification
  v_classification := CASE
    WHEN v_score_total >= 36 THEN 'hot'
    WHEN v_score_total >= 24 THEN 'warm'
    ELSE 'cold'
  END;
  
  -- Update the record
  NEW.score_ia_avivar := v_score_ia;
  NEW.score_license := v_score_license;
  NEW.score_legal := v_score_legal;
  NEW.score_timing := v_score_timing;
  NEW.score_total := v_score_total;
  NEW.lead_classification := v_classification;
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-calculate scores
CREATE TRIGGER trigger_calculate_day2_scores
BEFORE INSERT OR UPDATE ON public.day2_satisfaction_surveys
FOR EACH ROW
EXECUTE FUNCTION public.calculate_day2_scores();