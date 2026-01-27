-- =============================================
-- Migração Parte 1: Preparação para Mobile - Estrutura Base
-- =============================================
-- Nota: O valor de enum 'mobile_store_user' será adicionado em migração separada
-- Por agora, usamos TEXT para maior flexibilidade

-- =============================================
-- 1. Criar tabela de Feature Flags
-- =============================================
CREATE TABLE IF NOT EXISTS public.feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_enabled BOOLEAN DEFAULT true,
  environment VARCHAR(50) DEFAULT 'all', -- 'all', 'mobile', 'web', 'production', 'development'
  target_profiles TEXT[] DEFAULT '{}', -- perfis afetados (vazio = todos)
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índice para busca rápida
CREATE INDEX IF NOT EXISTS idx_feature_flags_key ON public.feature_flags(key);
CREATE INDEX IF NOT EXISTS idx_feature_flags_environment ON public.feature_flags(environment);

-- Enable RLS
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- Drop policies if exist then create
DROP POLICY IF EXISTS "Feature flags are readable by authenticated users" ON public.feature_flags;
DROP POLICY IF EXISTS "Admins can manage feature flags" ON public.feature_flags;

-- Políticas RLS - somente leitura para usuários autenticados
CREATE POLICY "Feature flags are readable by authenticated users"
  ON public.feature_flags FOR SELECT
  TO authenticated
  USING (true);

-- Políticas RLS - somente admins podem modificar
CREATE POLICY "Admins can manage feature flags"
  ON public.feature_flags FOR ALL
  TO authenticated
  USING (public.is_neohub_admin(auth.uid()));

-- =============================================
-- 2. Criar tabela de módulos bloqueados por ambiente
-- =============================================
CREATE TABLE IF NOT EXISTS public.mobile_blocked_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_code VARCHAR(100) NOT NULL,
  block_reason TEXT,
  is_active BOOLEAN DEFAULT true,
  blocked_at TIMESTAMPTZ DEFAULT now(),
  blocked_by UUID REFERENCES auth.users(id),
  UNIQUE(module_code)
);

-- Enable RLS
ALTER TABLE public.mobile_blocked_modules ENABLE ROW LEVEL SECURITY;

-- Drop policies if exist then create
DROP POLICY IF EXISTS "Mobile blocked modules are readable by authenticated" ON public.mobile_blocked_modules;
DROP POLICY IF EXISTS "Admins can manage mobile blocked modules" ON public.mobile_blocked_modules;

-- Políticas RLS
CREATE POLICY "Mobile blocked modules are readable by authenticated"
  ON public.mobile_blocked_modules FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage mobile blocked modules"
  ON public.mobile_blocked_modules FOR ALL
  TO authenticated
  USING (public.is_neohub_admin(auth.uid()));

-- =============================================
-- 3. Inserir feature flags iniciais para mobile
-- =============================================
INSERT INTO public.feature_flags (key, name, description, is_enabled, environment, target_profiles)
VALUES
  ('mobile_neocare_enabled', 'NeoCare no Mobile', 'Controla acesso ao portal NeoCare no app mobile', false, 'mobile', '{}'),
  ('mobile_neoteam_enabled', 'NeoTeam no Mobile', 'Controla acesso ao portal NeoTeam no app mobile', false, 'mobile', '{}'),
  ('mobile_clinic_enabled', 'Clinic no Mobile', 'Controla acesso ao módulo Clinic no app mobile', false, 'mobile', '{}'),
  ('mobile_prontuario_enabled', 'Prontuário no Mobile', 'Controla acesso a prontuários no app mobile', false, 'mobile', '{}'),
  ('mobile_anamnese_enabled', 'Anamnese no Mobile', 'Controla acesso a anamnese no app mobile', false, 'mobile', '{}'),
  ('mobile_document_upload_enabled', 'Upload de Documentos no Mobile', 'Controla upload de documentos sensíveis no mobile', false, 'mobile', '{}'),
  ('mobile_marketplace_enabled', 'Marketplace no Mobile', 'Controla acesso ao marketplace no app mobile', false, 'mobile', '{}'),
  ('mobile_academy_enabled', 'Academy no Mobile', 'Controla acesso ao Academy no app mobile', true, 'mobile', '{}'),
  ('mobile_profile_enabled', 'Perfil no Mobile', 'Controla acesso ao perfil do usuário no mobile', true, 'mobile', '{}'),
  ('mobile_notifications_enabled', 'Notificações no Mobile', 'Controla acesso a notificações no mobile', true, 'mobile', '{}'),
  ('mobile_postvenda_enabled', 'Pós-Venda no Mobile', 'Controla acesso ao módulo de pós-venda no mobile', false, 'mobile', '{}')
ON CONFLICT (key) DO UPDATE SET
  is_enabled = EXCLUDED.is_enabled,
  environment = EXCLUDED.environment,
  target_profiles = EXCLUDED.target_profiles,
  updated_at = now();

-- =============================================
-- 4. Inserir módulos bloqueados no mobile
-- =============================================
INSERT INTO public.mobile_blocked_modules (module_code, block_reason)
VALUES
  ('neocare', 'Módulo com dados sensíveis de pacientes - não aprovado para primeira versão mobile'),
  ('neocare_appointments', 'Sub-módulo NeoCare - bloqueado'),
  ('neocare_documents', 'Sub-módulo NeoCare - bloqueado'),
  ('neocare_history', 'Sub-módulo NeoCare - bloqueado'),
  ('neocare_profile', 'Sub-módulo NeoCare - bloqueado'),
  ('neoteam', 'Módulo interno de equipe - não aprovado para primeira versão mobile'),
  ('neoteam_schedule', 'Sub-módulo NeoTeam - bloqueado'),
  ('neoteam_patients', 'Sub-módulo NeoTeam - bloqueado'),
  ('neoteam_waiting_room', 'Sub-módulo NeoTeam - bloqueado'),
  ('neoteam_documents', 'Sub-módulo NeoTeam - bloqueado'),
  ('clinic', 'Módulo clínico interno - não aprovado para mobile'),
  ('prontuario', 'Prontuários médicos - dados sensíveis'),
  ('anamnese', 'Anamnese médica - dados sensíveis'),
  ('document_upload', 'Upload de documentos sensíveis - bloqueado'),
  ('marketplace', 'Marketplace - em desenvolvimento para mobile'),
  ('postvenda', 'Pós-venda - módulo interno')
ON CONFLICT (module_code) DO NOTHING;

-- =============================================
-- 5. Função auxiliar para verificar se módulo está bloqueado no mobile
-- =============================================
CREATE OR REPLACE FUNCTION public.is_module_blocked_on_mobile(_module_code TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.mobile_blocked_modules
    WHERE module_code = _module_code
      AND is_active = true
  )
$$;

-- =============================================
-- 6. Função para verificar feature flag
-- =============================================
CREATE OR REPLACE FUNCTION public.is_feature_enabled(_feature_key TEXT, _environment TEXT DEFAULT 'all')
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_enabled FROM public.feature_flags
     WHERE key = _feature_key
       AND (environment = _environment OR environment = 'all')
     LIMIT 1),
    false
  )
$$;

-- =============================================
-- 7. Trigger para updated_at (drop if exists first)
-- =============================================
DROP TRIGGER IF EXISTS update_feature_flags_updated_at ON public.feature_flags;

CREATE TRIGGER update_feature_flags_updated_at
  BEFORE UPDATE ON public.feature_flags
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 8. Conceder permissões de execução
-- =============================================
GRANT EXECUTE ON FUNCTION public.is_module_blocked_on_mobile(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_feature_enabled(TEXT, TEXT) TO authenticated;