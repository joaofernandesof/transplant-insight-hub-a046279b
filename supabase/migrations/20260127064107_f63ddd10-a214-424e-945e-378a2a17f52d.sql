-- Tabela para armazenar links públicos de dashboards
CREATE TABLE public.shared_dashboard_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token VARCHAR(64) UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  dashboard_type VARCHAR(100) NOT NULL,
  dashboard_config JSONB DEFAULT '{}',
  title VARCHAR(255),
  description TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMPTZ,
  password_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_shared_dashboard_token ON public.shared_dashboard_links(token) WHERE is_active = true;
CREATE INDEX idx_shared_dashboard_created_by ON public.shared_dashboard_links(created_by);

-- Enable RLS
ALTER TABLE public.shared_dashboard_links ENABLE ROW LEVEL SECURITY;

-- Política: usuários podem ver seus próprios links
CREATE POLICY "Users can view own shared links"
  ON public.shared_dashboard_links
  FOR SELECT
  TO authenticated
  USING (created_by = auth.uid() OR public.is_neohub_admin(auth.uid()));

-- Política: usuários podem criar links
CREATE POLICY "Users can create shared links"
  ON public.shared_dashboard_links
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Política: usuários podem atualizar seus próprios links
CREATE POLICY "Users can update own shared links"
  ON public.shared_dashboard_links
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid() OR public.is_neohub_admin(auth.uid()));

-- Política: usuários podem deletar seus próprios links
CREATE POLICY "Users can delete own shared links"
  ON public.shared_dashboard_links
  FOR DELETE
  TO authenticated
  USING (created_by = auth.uid() OR public.is_neohub_admin(auth.uid()));

-- Política: acesso anônimo para leitura por token (para página pública)
CREATE POLICY "Public can view active links by token"
  ON public.shared_dashboard_links
  FOR SELECT
  TO anon
  USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- Função para incrementar contagem de views
CREATE OR REPLACE FUNCTION public.increment_dashboard_view(p_token VARCHAR)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.shared_dashboard_links
  SET view_count = view_count + 1, last_viewed_at = now()
  WHERE token = p_token AND is_active = true;
END;
$$;

-- Trigger para updated_at
CREATE TRIGGER update_shared_dashboard_links_updated_at
  BEFORE UPDATE ON public.shared_dashboard_links
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();