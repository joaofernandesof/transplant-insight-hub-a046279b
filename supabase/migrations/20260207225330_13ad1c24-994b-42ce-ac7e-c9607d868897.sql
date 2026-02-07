
-- Drop the old overloaded version with UUID/VARCHAR signature
DROP FUNCTION IF EXISTS public.get_or_create_avivar_conversa(uuid, character varying, character varying, character varying);

-- Recreate the single canonical version with TEXT params
CREATE OR REPLACE FUNCTION public.get_or_create_avivar_conversa(
  p_user_id TEXT,
  p_numero TEXT,
  p_nome_contato TEXT DEFAULT NULL,
  p_conversa_id TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conversa_id UUID;
  v_account_id UUID;
BEGIN
  v_account_id := public.get_user_avivar_account_id(p_user_id);
  
  SELECT id INTO v_conversa_id 
  FROM public.avivar_conversas 
  WHERE account_id = v_account_id AND numero = p_numero 
  LIMIT 1;
  
  IF v_conversa_id IS NULL THEN
    INSERT INTO public.avivar_conversas (user_id, account_id, numero, nome_contato, conversa_id, status)
    VALUES (p_user_id, v_account_id, p_numero, p_nome_contato, p_conversa_id, 'aberta')
    RETURNING id INTO v_conversa_id;
  ELSE
    UPDATE public.avivar_conversas 
    SET nome_contato = COALESCE(p_nome_contato, nome_contato), updated_at = now() 
    WHERE id = v_conversa_id;
  END IF;
  
  RETURN v_conversa_id;
END;
$$;
