
-- Fix agent routing: compare target_kanbans UUIDs with actual kanban IDs, not hardcoded strings
CREATE OR REPLACE FUNCTION public.get_agent_for_lead_stage(
  p_user_id uuid, 
  p_lead_stage text DEFAULT 'novo_lead'::text,
  p_kanban_id uuid DEFAULT NULL
)
RETURNS TABLE(
  agent_id uuid, 
  agent_name text, 
  personality text, 
  ai_identity text, 
  ai_instructions text, 
  ai_restrictions text, 
  ai_objective text, 
  tone_of_voice text, 
  company_name text, 
  professional_name text, 
  fluxo_atendimento jsonb, 
  services jsonb, 
  target_kanbans text[], 
  target_stages text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Find agent that operates on this specific kanban (by UUID) or stage
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
      -- Match by kanban UUID (primary method)
      (p_kanban_id IS NOT NULL AND p_kanban_id::text = ANY(a.target_kanbans))
      -- Or match by stage (fallback)
      OR p_lead_stage = ANY(a.target_stages)
    )
  ORDER BY 
    -- Prioritize exact kanban match
    CASE WHEN p_kanban_id IS NOT NULL AND p_kanban_id::text = ANY(a.target_kanbans) THEN 0 ELSE 1 END,
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
