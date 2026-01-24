-- Dropar tabela se existir (parcialmente criada)
DROP TABLE IF EXISTS public.system_event_logs CASCADE;

-- Recriar tabela de logs de eventos do sistema
CREATE TABLE public.system_event_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name TEXT,
  user_email TEXT,
  event_type TEXT NOT NULL,
  event_category TEXT NOT NULL,
  event_name TEXT NOT NULL,
  module TEXT,
  page_path TEXT,
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para consultas rápidas
CREATE INDEX idx_event_logs_user_id ON public.system_event_logs(user_id);
CREATE INDEX idx_event_logs_created_at ON public.system_event_logs(created_at DESC);
CREATE INDEX idx_event_logs_event_type ON public.system_event_logs(event_type);
CREATE INDEX idx_event_logs_module ON public.system_event_logs(module);
CREATE INDEX idx_event_logs_page_path ON public.system_event_logs(page_path);

-- RLS
ALTER TABLE public.system_event_logs ENABLE ROW LEVEL SECURITY;

-- Política para admins verem todos os logs (usando user_id correto)
CREATE POLICY "Admins can view all event logs"
ON public.system_event_logs FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM neohub_users nu
    JOIN neohub_user_profiles nup ON nup.neohub_user_id = nu.id
    WHERE nu.user_id = auth.uid()
    AND nup.profile = 'administrador'
    AND nup.is_active = true
  )
);

-- Política para inserir logs (qualquer usuário autenticado)
CREATE POLICY "Authenticated users can insert event logs"
ON public.system_event_logs FOR INSERT
TO authenticated
WITH CHECK (true);

-- Política para anônimos inserirem logs de página pública
CREATE POLICY "Anonymous can insert page view logs"
ON public.system_event_logs FOR INSERT
TO anon
WITH CHECK (event_type = 'page_view');