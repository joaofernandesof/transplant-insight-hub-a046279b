-- Update the calculate_day2_scores function with new License questions
CREATE OR REPLACE FUNCTION public.calculate_day2_scores()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  
  -- Calculate License Score (Q15 Budget + Q16 Need + Q17 Timing) - Max 18
  -- NEW: Direct BNT questions with R$ 80.000 reference
  v_score_license := CASE NEW.q15_license_path
    WHEN 'Não é viável para mim hoje' THEN 0
    WHEN 'Seria viável apenas com muito planejamento' THEN 2
    WHEN 'É viável se o modelo fizer sentido' THEN 4
    WHEN 'É totalmente viável para mim' THEN 6
    ELSE 0
  END;
  
  v_score_license := v_score_license + CASE NEW.q16_license_pace
    WHEN 'Não me expõe' THEN 0
    WHEN 'Me expõe pouco' THEN 2
    WHEN 'Me expõe bastante' THEN 4
    WHEN 'É um dos meus principais gargalos' THEN 6
    ELSE 0
  END;
  
  v_score_license := v_score_license + CASE NEW.q17_license_timing
    WHEN 'Não penso nisso no momento' THEN 0
    WHEN 'Talvez em um futuro distante' THEN 2
    WHEN 'Nos próximos meses' THEN 4
    WHEN 'Agora é o momento certo' THEN 6
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
$function$;