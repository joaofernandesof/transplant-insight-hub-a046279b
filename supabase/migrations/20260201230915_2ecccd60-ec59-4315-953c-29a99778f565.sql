-- Tabela para colunas customizáveis do Kanban
CREATE TABLE public.avivar_kanban_columns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kanban_id UUID NOT NULL REFERENCES public.avivar_kanbans(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(50) DEFAULT 'from-blue-500 to-blue-600',
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.avivar_kanban_columns ENABLE ROW LEVEL SECURITY;

-- RLS Policies: usuário só acessa colunas de seus próprios kanbans
CREATE POLICY "Users can view columns of their kanbans"
ON public.avivar_kanban_columns
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.avivar_kanbans k
    WHERE k.id = kanban_id AND k.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create columns in their kanbans"
ON public.avivar_kanban_columns
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.avivar_kanbans k
    WHERE k.id = kanban_id AND k.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update columns of their kanbans"
ON public.avivar_kanban_columns
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.avivar_kanbans k
    WHERE k.id = kanban_id AND k.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete columns of their kanbans"
ON public.avivar_kanban_columns
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.avivar_kanbans k
    WHERE k.id = kanban_id AND k.user_id = auth.uid()
  )
);

-- Trigger para updated_at
CREATE TRIGGER update_avivar_kanban_columns_updated_at
BEFORE UPDATE ON public.avivar_kanban_columns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Função para criar kanbans e colunas padrão para novo usuário
CREATE OR REPLACE FUNCTION public.create_default_avivar_kanbans(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_comercial_id UUID;
  v_pos_venda_id UUID;
BEGIN
  -- Verificar se usuário já tem kanbans
  IF EXISTS (SELECT 1 FROM avivar_kanbans WHERE user_id = p_user_id) THEN
    RETURN;
  END IF;

  -- Criar Kanban Comercial
  INSERT INTO avivar_kanbans (user_id, name, description, icon, color, order_index)
  VALUES (p_user_id, 'Comercial', 'Funil de vendas e captação de leads', 'briefcase', 'from-blue-500 to-indigo-600', 0)
  RETURNING id INTO v_comercial_id;

  -- Colunas do Kanban Comercial
  INSERT INTO avivar_kanban_columns (kanban_id, name, color, order_index) VALUES
    (v_comercial_id, 'Lead de Entrada', 'from-gray-500 to-gray-600', 0),
    (v_comercial_id, 'Triagem', 'from-yellow-500 to-amber-600', 1),
    (v_comercial_id, 'Tentando Agendar', 'from-orange-500 to-orange-600', 2),
    (v_comercial_id, 'Reagendamento', 'from-pink-500 to-rose-600', 3),
    (v_comercial_id, 'Agendado', 'from-blue-500 to-blue-600', 4),
    (v_comercial_id, 'Follow Up', 'from-purple-500 to-purple-600', 5),
    (v_comercial_id, 'Cliente', 'from-emerald-500 to-green-600', 6),
    (v_comercial_id, 'Desqualificados', 'from-red-500 to-red-600', 7);

  -- Criar Kanban Pós-Venda
  INSERT INTO avivar_kanbans (user_id, name, description, icon, color, order_index)
  VALUES (p_user_id, 'Pós-Venda', 'Acompanhamento pós-procedimento', 'heart-pulse', 'from-emerald-500 to-teal-600', 1)
  RETURNING id INTO v_pos_venda_id;

  -- Colunas do Kanban Pós-Venda
  INSERT INTO avivar_kanban_columns (kanban_id, name, color, order_index) VALUES
    (v_pos_venda_id, 'Onboarding', 'from-cyan-500 to-cyan-600', 0),
    (v_pos_venda_id, 'Cobrando Assinatura de Contrato', 'from-amber-500 to-orange-600', 1),
    (v_pos_venda_id, 'Contrato Assinado', 'from-emerald-500 to-green-600', 2);
END;
$$;