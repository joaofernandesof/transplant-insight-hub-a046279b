-- Fix type mismatch in get_agent_for_lead_stage function
-- The agent_name column returns varchar(100) but function expects text

CREATE OR REPLACE FUNCTION public.get_agent_for_lead_stage(p_user_id uuid, p_lead_stage text DEFAULT 'novo_lead'::text)
 RETURNS TABLE(agent_id uuid, agent_name text, personality text, ai_identity text, ai_instructions text, ai_restrictions text, ai_objective text, tone_of_voice text, company_name text, professional_name text, fluxo_atendimento jsonb, services jsonb, target_kanbans text[], target_stages text[])
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_kanban TEXT;
BEGIN
  -- Map stage to kanban
  v_kanban := CASE
    WHEN p_lead_stage IN ('novo_lead', 'qualificacao', 'agendado', 'compareceu') THEN 'comercial'
    WHEN p_lead_stage IN ('pos_procedimento', 'acompanhamento') THEN 'pos_venda'
    WHEN p_lead_stage IN ('inativo') THEN 'reativacao'
    ELSE 'comercial'
  END;

  -- Find agent that operates on this kanban/stage - CAST varchar to text
  RETURN QUERY
  SELECT 
    a.id as agent_id,
    a.name::text as agent_name,
    a.personality::text,
    a.ai_identity::text,
    a.ai_instructions::text,
    a.ai_restrictions::text,
    a.ai_objective::text,
    a.tone_of_voice::text,
    a.company_name::text,
    a.professional_name::text,
    a.fluxo_atendimento::jsonb,
    a.services::jsonb,
    a.target_kanbans,
    a.target_stages
  FROM avivar_agents a
  WHERE a.user_id = p_user_id
    AND a.is_active = true
    AND (
      v_kanban = ANY(a.target_kanbans)
      OR p_lead_stage = ANY(a.target_stages)
    )
  ORDER BY 
    CASE WHEN p_lead_stage = ANY(a.target_stages) THEN 0 ELSE 1 END,
    a.created_at DESC
  LIMIT 1;

  -- Fallback: get first active agent if none specific found
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      a.id as agent_id,
      a.name::text as agent_name,
      a.personality::text,
      a.ai_identity::text,
      a.ai_instructions::text,
      a.ai_restrictions::text,
      a.ai_objective::text,
      a.tone_of_voice::text,
      a.company_name::text,
      a.professional_name::text,
      a.fluxo_atendimento::jsonb,
      a.services::jsonb,
      a.target_kanbans,
      a.target_stages
    FROM avivar_agents a
    WHERE a.user_id = p_user_id
      AND a.is_active = true
    ORDER BY a.created_at DESC
    LIMIT 1;
  END IF;
END;
$function$;