
-- FIX: Set search_path on functions missing it

-- 1. get_avivar_agendas_for_ai (must DROP first due to return type)
DROP FUNCTION IF EXISTS public.get_avivar_agendas_for_ai(uuid);

CREATE OR REPLACE FUNCTION public.get_avivar_agendas_for_ai(p_user_id uuid)
RETURNS TABLE(agenda_id uuid, agenda_name text, professional_name text, city text, address text)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT id as agenda_id, name as agenda_name, professional_name, city, address
  FROM avivar_agendas
  WHERE user_id = p_user_id AND is_active = true
  ORDER BY name;
$function$;
