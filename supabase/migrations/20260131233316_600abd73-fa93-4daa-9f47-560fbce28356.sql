-- =============================================
-- AVIVAR MULTI-AGENT SYSTEM + PRODUCTS TABLE
-- =============================================

-- 1. Tabela de Produtos para os agentes consultarem
CREATE TABLE IF NOT EXISTS public.avivar_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT, -- 'produto', 'servico', 'pacote'
  price NUMERIC(10, 2),
  promotional_price NUMERIC(10, 2),
  stock_quantity INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Habilitar RLS na tabela de produtos
ALTER TABLE public.avivar_products ENABLE ROW LEVEL SECURITY;

-- 3. Políticas RLS para produtos
CREATE POLICY "Users can view their own products"
ON public.avivar_products FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own products"
ON public.avivar_products FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own products"
ON public.avivar_products FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own products"
ON public.avivar_products FOR DELETE
USING (auth.uid() = user_id);

-- 4. Trigger para updated_at
CREATE TRIGGER update_avivar_products_updated_at
  BEFORE UPDATE ON public.avivar_products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Função RPC para IA consultar produtos (SECURITY DEFINER para bypass RLS)
CREATE OR REPLACE FUNCTION public.get_avivar_products_for_ai(p_user_id UUID)
RETURNS TABLE (
  product_id UUID,
  name TEXT,
  description TEXT,
  category TEXT,
  price NUMERIC,
  promotional_price NUMERIC,
  stock_quantity INTEGER,
  is_active BOOLEAN
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id as product_id, name, description, category, price, promotional_price, stock_quantity, is_active
  FROM avivar_products
  WHERE user_id = p_user_id AND is_active = true
  ORDER BY name;
$$;

-- 6. Função RPC para selecionar agente baseado em estágio do lead (ROTEAMENTO HÍBRIDO)
CREATE OR REPLACE FUNCTION public.get_agent_for_lead_stage(
  p_user_id UUID,
  p_lead_stage TEXT DEFAULT 'novo_lead'
)
RETURNS TABLE (
  agent_id UUID,
  agent_name TEXT,
  personality TEXT,
  ai_identity TEXT,
  ai_instructions TEXT,
  ai_restrictions TEXT,
  ai_objective TEXT,
  tone_of_voice TEXT,
  company_name TEXT,
  professional_name TEXT,
  fluxo_atendimento JSONB,
  services JSONB,
  target_kanbans TEXT[],
  target_stages TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_kanban TEXT;
BEGIN
  -- Mapear estágio para kanban
  v_kanban := CASE
    WHEN p_lead_stage IN ('novo_lead', 'qualificacao', 'agendado', 'compareceu') THEN 'comercial'
    WHEN p_lead_stage IN ('pos_procedimento', 'acompanhamento') THEN 'pos_venda'
    WHEN p_lead_stage IN ('inativo') THEN 'reativacao'
    ELSE 'comercial'
  END;

  -- Buscar agente que atua nesse kanban/estágio
  RETURN QUERY
  SELECT 
    a.id as agent_id,
    a.name as agent_name,
    a.personality,
    a.ai_identity,
    a.ai_instructions,
    a.ai_restrictions,
    a.ai_objective,
    a.tone_of_voice,
    a.company_name,
    a.professional_name,
    a.fluxo_atendimento::jsonb,
    a.services::jsonb,
    a.target_kanbans,
    a.target_stages
  FROM avivar_agents a
  WHERE a.user_id = p_user_id
    AND a.is_active = true
    AND (
      -- Verifica se o agente atua neste kanban
      v_kanban = ANY(a.target_kanbans)
      -- OU verifica se atua neste estágio específico
      OR p_lead_stage = ANY(a.target_stages)
    )
  ORDER BY 
    -- Prioridade para match de estágio específico
    CASE WHEN p_lead_stage = ANY(a.target_stages) THEN 0 ELSE 1 END,
    a.created_at DESC
  LIMIT 1;

  -- Se nenhum agente específico, pegar o primeiro ativo (fallback)
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      a.id as agent_id,
      a.name as agent_name,
      a.personality,
      a.ai_identity,
      a.ai_instructions,
      a.ai_restrictions,
      a.ai_objective,
      a.tone_of_voice,
      a.company_name,
      a.professional_name,
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
$$;