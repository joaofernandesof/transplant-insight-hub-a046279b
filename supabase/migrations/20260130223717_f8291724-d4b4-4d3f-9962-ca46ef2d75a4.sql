-- Recreate the function with text type
CREATE OR REPLACE FUNCTION public.get_or_create_avivar_conversa(p_user_id text, p_numero text, p_conversa_id text DEFAULT NULL::text, p_nome_contato text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_conversa_id UUID;
BEGIN
  SELECT id INTO v_conversa_id
  FROM public.avivar_conversas
  WHERE user_id = p_user_id AND numero = p_numero
  LIMIT 1;
  
  IF v_conversa_id IS NULL THEN
    INSERT INTO public.avivar_conversas (user_id, numero, conversa_id, nome_contato)
    VALUES (p_user_id, p_numero, p_conversa_id, p_nome_contato)
    RETURNING id INTO v_conversa_id;
  ELSE
    IF p_nome_contato IS NOT NULL THEN
      UPDATE public.avivar_conversas
      SET nome_contato = p_nome_contato, updated_at = now()
      WHERE id = v_conversa_id AND (nome_contato IS NULL OR nome_contato = '');
    END IF;
  END IF;
  
  RETURN v_conversa_id;
END;
$function$;

-- Recreate RLS policies for avivar_conversas
CREATE POLICY "Users can view own conversations" 
ON public.avivar_conversas FOR SELECT 
USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert own conversations" 
ON public.avivar_conversas FOR INSERT 
WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update own conversations" 
ON public.avivar_conversas FOR UPDATE 
USING (user_id = auth.uid()::text);

CREATE POLICY "Users can delete own conversations" 
ON public.avivar_conversas FOR DELETE 
USING (user_id = auth.uid()::text);

-- Recreate RLS policies for avivar_mensagens (conversa_id is uuid, c.id is uuid - proper cast)
CREATE POLICY "Users can view messages from own conversations" 
ON public.avivar_mensagens FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.avivar_conversas c WHERE c.id = avivar_mensagens.conversa_id::uuid AND c.user_id = auth.uid()::text));

CREATE POLICY "Users can insert messages to own conversations" 
ON public.avivar_mensagens FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM public.avivar_conversas c WHERE c.id = avivar_mensagens.conversa_id::uuid AND c.user_id = auth.uid()::text));

CREATE POLICY "Users can update messages in own conversations" 
ON public.avivar_mensagens FOR UPDATE 
USING (EXISTS (SELECT 1 FROM public.avivar_conversas c WHERE c.id = avivar_mensagens.conversa_id::uuid AND c.user_id = auth.uid()::text));

CREATE POLICY "Users can delete messages in own conversations" 
ON public.avivar_mensagens FOR DELETE 
USING (EXISTS (SELECT 1 FROM public.avivar_conversas c WHERE c.id = avivar_mensagens.conversa_id::uuid AND c.user_id = auth.uid()::text));