-- Drop the old trigger and function
DROP TRIGGER IF EXISTS trigger_calculate_day2_scores ON public.day2_satisfaction_surveys;
DROP FUNCTION IF EXISTS public.calculate_day2_scores();

-- Add new columns and remove old ones
ALTER TABLE public.day2_satisfaction_surveys 
  ADD COLUMN IF NOT EXISTS q14_avivar_timing TEXT,
  DROP COLUMN IF EXISTS q18_timing_next_60_days,
  DROP COLUMN IF EXISTS q19_timing_individual_interest,
  DROP COLUMN IF EXISTS q20_insight_final,
  DROP COLUMN IF EXISTS score_timing;

-- Rename columns for new structure
ALTER TABLE public.day2_satisfaction_surveys
  RENAME COLUMN q14_license_current_structure TO q15_license_path;
ALTER TABLE public.day2_satisfaction_surveys
  RENAME COLUMN q15_license_acceleration TO q16_license_pace;
ALTER TABLE public.day2_satisfaction_surveys
  ADD COLUMN IF NOT EXISTS q17_license_timing TEXT;
ALTER TABLE public.day2_satisfaction_surveys
  RENAME COLUMN q16_legal_current_structure TO q18_legal_feeling;
ALTER TABLE public.day2_satisfaction_surveys
  RENAME COLUMN q17_legal_limitations TO q19_legal_influence;
ALTER TABLE public.day2_satisfaction_surveys
  ADD COLUMN IF NOT EXISTS q20_legal_timing TEXT;

-- Create updated scoring function
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
  v_score_total INTEGER := 0;
  v_classification TEXT;
BEGIN
  -- Calculate IA Avivar Score (Q12 + Q13 + Q14) - Max 18
  v_score_ia := CASE NEW.q12_avivar_current_process
    WHEN 'Tudo depende de pessoas e memória' THEN 0
    WHEN 'Tenho organização básica, mas com falhas frequentes' THEN 2
    WHEN 'Consigo organizar, mas sinto limites claros' THEN 4
    WHEN 'Tenho estrutura e quero ganhar escala e previsibilidade' THEN 6
    ELSE 0
  END;
  
  v_score_ia := v_score_ia + CASE NEW.q13_avivar_opportunity_loss
    WHEN 'Funciona bem do jeito que está' THEN 0
    WHEN 'Funciona, mas gera desgaste' THEN 2
    WHEN 'Funciona com perda de oportunidades' THEN 4
    WHEN 'É um gargalo claro no crescimento' THEN 6
    ELSE 0
  END;
  
  v_score_ia := v_score_ia + CASE NEW.q14_avivar_timing
    WHEN 'Não é prioridade agora' THEN 0
    WHEN 'Quando tiver mais tempo' THEN 2
    WHEN 'Nos próximos meses' THEN 4
    WHEN 'O quanto antes' THEN 6
    ELSE 0
  END;
  
  -- Calculate License Score (Q15 + Q16 + Q17) - Max 18
  v_score_license := CASE NEW.q15_license_path
    WHEN 'Estou construindo tudo por tentativa e erro' THEN 0
    WHEN 'Tenho referências, mas sigo ajustando sozinho' THEN 2
    WHEN 'Sigo um caminho mais claro, mas ainda incompleto' THEN 4
    WHEN 'Quero um modelo validado para acelerar sem errar' THEN 6
    ELSE 0
  END;
  
  v_score_license := v_score_license + CASE NEW.q16_license_pace
    WHEN 'No ritmo que consigo, sem pressa' THEN 0
    WHEN 'Um pouco mais lento do que gostaria' THEN 2
    WHEN 'Bem mais lento do que poderia' THEN 4
    WHEN 'Mais lento do que é aceitável para meus objetivos' THEN 6
    ELSE 0
  END;
  
  v_score_license := v_score_license + CASE NEW.q17_license_timing
    WHEN 'Ainda não penso nisso' THEN 0
    WHEN 'Talvez mais para frente' THEN 2
    WHEN 'Nos próximos meses' THEN 4
    WHEN 'Já deveria estar assim' THEN 6
    ELSE 0
  END;
  
  -- Calculate Legal Score (Q18 + Q19 + Q20) - Max 18
  v_score_legal := CASE NEW.q18_legal_feeling
    WHEN 'Tranquilo e seguro' THEN 0
    WHEN 'Um pouco inseguro' THEN 2
    WHEN 'Inseguro em alguns pontos' THEN 4
    WHEN 'Exposto a riscos que me preocupam' THEN 6
    ELSE 0
  END;
  
  v_score_legal := v_score_legal + CASE NEW.q19_legal_influence
    WHEN 'Não influenciam' THEN 0
    WHEN 'Influenciam pouco' THEN 2
    WHEN 'Influenciam bastante' THEN 4
    WHEN 'Travaram ou quase travaram decisões importantes' THEN 6
    ELSE 0
  END;
  
  v_score_legal := v_score_legal + CASE NEW.q20_legal_timing
    WHEN 'Não vejo isso como prioridade' THEN 0
    WHEN 'Quando o negócio estiver maior' THEN 2
    WHEN 'Nos próximos meses' THEN 4
    WHEN 'O quanto antes' THEN 6
    ELSE 0
  END;
  
  -- Calculate total score (max 54)
  v_score_total := v_score_ia + v_score_license + v_score_legal;
  
  -- Determine classification
  v_classification := CASE
    WHEN v_score_total >= 40 THEN 'hot'
    WHEN v_score_total >= 25 THEN 'warm'
    ELSE 'cold'
  END;
  
  -- Update the record
  NEW.score_ia_avivar := v_score_ia;
  NEW.score_license := v_score_license;
  NEW.score_legal := v_score_legal;
  NEW.score_total := v_score_total;
  NEW.lead_classification := v_classification;
  
  RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER trigger_calculate_day2_scores
BEFORE INSERT OR UPDATE ON public.day2_satisfaction_surveys
FOR EACH ROW
EXECUTE FUNCTION public.calculate_day2_scores();