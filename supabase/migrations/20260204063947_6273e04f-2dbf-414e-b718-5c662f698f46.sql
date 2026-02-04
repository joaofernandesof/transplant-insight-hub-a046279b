-- Tabela de Log de Ações do Portal CPG
CREATE TABLE IF NOT EXISTS public.ipromed_activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  user_name TEXT,
  user_email TEXT,
  action_type TEXT NOT NULL, -- 'create', 'update', 'delete', 'view', 'login', 'logout', etc.
  entity_type TEXT NOT NULL, -- 'client', 'contract', 'meeting', 'task', 'document', etc.
  entity_id UUID,
  entity_name TEXT,
  description TEXT NOT NULL, -- Descrição legível da ação
  metadata JSONB DEFAULT '{}', -- Dados adicionais
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_ipromed_activity_logs_user_id ON public.ipromed_activity_logs(user_id);
CREATE INDEX idx_ipromed_activity_logs_action_type ON public.ipromed_activity_logs(action_type);
CREATE INDEX idx_ipromed_activity_logs_entity_type ON public.ipromed_activity_logs(entity_type);
CREATE INDEX idx_ipromed_activity_logs_created_at ON public.ipromed_activity_logs(created_at DESC);
CREATE INDEX idx_ipromed_activity_logs_description_search ON public.ipromed_activity_logs USING gin(to_tsvector('portuguese', description));

-- Enable RLS
ALTER TABLE public.ipromed_activity_logs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS - apenas usuários autenticados podem ver os logs
CREATE POLICY "Usuários autenticados podem ver logs" 
ON public.ipromed_activity_logs 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Usuários podem inserir logs (para registrar suas próprias ações)
CREATE POLICY "Usuários podem inserir logs" 
ON public.ipromed_activity_logs 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.ipromed_activity_logs;