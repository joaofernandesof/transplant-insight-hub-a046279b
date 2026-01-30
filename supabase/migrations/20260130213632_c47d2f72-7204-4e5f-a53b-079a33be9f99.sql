-- =============================================
-- AVIVAR INBOX - Backend Structure
-- =============================================

-- Tabela: avivar_conversas
-- Armazena o contexto de cada lead ou cliente
CREATE TABLE public.avivar_conversas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversa_id TEXT UNIQUE, -- ID externo do Uazapi/n8n
  numero TEXT NOT NULL,
  nome_contato TEXT,
  ultima_mensagem TEXT,
  ultimo_horario TIMESTAMPTZ DEFAULT now(),
  nao_lidas INTEGER DEFAULT 0,
  importante BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'aberta' CHECK (status IN ('aberta', 'em_atendimento', 'resolvida', 'arquivada')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_avivar_conversas_user_id ON public.avivar_conversas(user_id);
CREATE INDEX idx_avivar_conversas_numero ON public.avivar_conversas(numero);
CREATE INDEX idx_avivar_conversas_status ON public.avivar_conversas(status);
CREATE INDEX idx_avivar_conversas_ultimo_horario ON public.avivar_conversas(ultimo_horario DESC);

-- RLS para avivar_conversas
ALTER TABLE public.avivar_conversas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversations"
ON public.avivar_conversas FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations"
ON public.avivar_conversas FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations"
ON public.avivar_conversas FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations"
ON public.avivar_conversas FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Service role bypass para webhooks externos
CREATE POLICY "Service role full access conversas"
ON public.avivar_conversas FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- =============================================
-- Tabela: avivar_mensagens
-- Armazena cada mensagem individual da conversa
-- =============================================

CREATE TABLE public.avivar_mensagens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversa_id UUID NOT NULL REFERENCES public.avivar_conversas(id) ON DELETE CASCADE,
  numero TEXT NOT NULL,
  mensagem TEXT,
  direcao TEXT NOT NULL CHECK (direcao IN ('entrada', 'saida')),
  nome_contato TEXT,
  data_hora TIMESTAMPTZ DEFAULT now(),
  lida BOOLEAN DEFAULT false,
  tipo_mensagem TEXT DEFAULT 'text' CHECK (tipo_mensagem IN ('text', 'image', 'audio', 'video', 'document', 'sticker', 'location')),
  url_arquivo TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_avivar_mensagens_conversa_id ON public.avivar_mensagens(conversa_id);
CREATE INDEX idx_avivar_mensagens_data_hora ON public.avivar_mensagens(data_hora DESC);
CREATE INDEX idx_avivar_mensagens_direcao ON public.avivar_mensagens(direcao);

-- RLS para avivar_mensagens
ALTER TABLE public.avivar_mensagens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages from own conversations"
ON public.avivar_mensagens FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.avivar_conversas c
    WHERE c.id = avivar_mensagens.conversa_id
    AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert messages to own conversations"
ON public.avivar_mensagens FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.avivar_conversas c
    WHERE c.id = avivar_mensagens.conversa_id
    AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update messages in own conversations"
ON public.avivar_mensagens FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.avivar_conversas c
    WHERE c.id = avivar_mensagens.conversa_id
    AND c.user_id = auth.uid()
  )
);

-- Service role bypass para webhooks externos
CREATE POLICY "Service role full access mensagens"
ON public.avivar_mensagens FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- =============================================
-- Trigger: Atualizar conversa ao receber mensagem
-- =============================================

CREATE OR REPLACE FUNCTION public.update_avivar_conversa_on_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.avivar_conversas
  SET 
    ultima_mensagem = NEW.mensagem,
    ultimo_horario = NEW.data_hora,
    nao_lidas = CASE 
      WHEN NEW.direcao = 'entrada' THEN nao_lidas + 1 
      ELSE nao_lidas 
    END,
    updated_at = now()
  WHERE id = NEW.conversa_id;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_conversa_on_message
AFTER INSERT ON public.avivar_mensagens
FOR EACH ROW
EXECUTE FUNCTION public.update_avivar_conversa_on_message();

-- =============================================
-- Trigger: Updated_at automático
-- =============================================

CREATE TRIGGER update_avivar_conversas_updated_at
BEFORE UPDATE ON public.avivar_conversas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_avivar_mensagens_updated_at
BEFORE UPDATE ON public.avivar_mensagens
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- Função: Marcar mensagens como lidas
-- =============================================

CREATE OR REPLACE FUNCTION public.mark_avivar_messages_as_read(p_conversa_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Marcar mensagens como lidas
  UPDATE public.avivar_mensagens
  SET lida = true, updated_at = now()
  WHERE conversa_id = p_conversa_id
    AND direcao = 'entrada'
    AND lida = false;
  
  -- Zerar contador de não lidas na conversa
  UPDATE public.avivar_conversas
  SET nao_lidas = 0, updated_at = now()
  WHERE id = p_conversa_id;
END;
$$;

-- =============================================
-- Função: Buscar ou criar conversa por número
-- =============================================

CREATE OR REPLACE FUNCTION public.get_or_create_avivar_conversa(
  p_user_id UUID,
  p_numero TEXT,
  p_conversa_id TEXT DEFAULT NULL,
  p_nome_contato TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conversa_id UUID;
BEGIN
  -- Tentar encontrar conversa existente pelo número
  SELECT id INTO v_conversa_id
  FROM public.avivar_conversas
  WHERE user_id = p_user_id AND numero = p_numero
  LIMIT 1;
  
  -- Se não existir, criar nova
  IF v_conversa_id IS NULL THEN
    INSERT INTO public.avivar_conversas (user_id, numero, conversa_id, nome_contato)
    VALUES (p_user_id, p_numero, p_conversa_id, p_nome_contato)
    RETURNING id INTO v_conversa_id;
  ELSE
    -- Atualizar nome do contato se fornecido
    IF p_nome_contato IS NOT NULL THEN
      UPDATE public.avivar_conversas
      SET nome_contato = p_nome_contato, updated_at = now()
      WHERE id = v_conversa_id AND (nome_contato IS NULL OR nome_contato = '');
    END IF;
  END IF;
  
  RETURN v_conversa_id;
END;
$$;

-- Enable Realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.avivar_conversas;
ALTER PUBLICATION supabase_realtime ADD TABLE public.avivar_mensagens;