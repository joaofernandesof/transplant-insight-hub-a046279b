
DROP FUNCTION IF EXISTS public.validate_api_token(text);

CREATE FUNCTION public.validate_api_token(p_token_hash text)
 RETURNS TABLE(account_id uuid, permissions text[], token_id uuid, target_kanban_id uuid, target_column_id uuid)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT t.account_id, t.permissions, t.id as token_id, t.target_kanban_id, t.target_column_id
  FROM public.avivar_api_tokens t
  WHERE t.token_hash = p_token_hash
    AND t.is_active = true
    AND (t.expires_at IS NULL OR t.expires_at > now())
  LIMIT 1;
$function$;
