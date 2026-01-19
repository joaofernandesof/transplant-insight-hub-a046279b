-- ====================================
-- MIGRAÇÃO PARTE 2: Criar tabela e funções RBAC
-- ====================================

-- 1. Criar tabela de permissões por módulo
CREATE TABLE IF NOT EXISTS public.neohub_module_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile neohub_profile NOT NULL,
  module_code TEXT NOT NULL,
  module_name TEXT NOT NULL,
  portal TEXT NOT NULL,
  can_read BOOLEAN DEFAULT true,
  can_write BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(profile, module_code)
);

-- Habilitar RLS
ALTER TABLE public.neohub_module_permissions ENABLE ROW LEVEL SECURITY;

-- Política: Todos autenticados podem ler permissões (para verificar acesso)
CREATE POLICY "Authenticated can read module permissions"
ON public.neohub_module_permissions
FOR SELECT
TO authenticated
USING (true);

-- 2. Função para verificar se usuário é administrador (bypass de permissões)
CREATE OR REPLACE FUNCTION public.is_neohub_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.neohub_user_profiles nup
    JOIN public.neohub_users nu ON nu.id = nup.neohub_user_id
    WHERE nu.user_id = _user_id
      AND nup.profile = 'administrador'
      AND nup.is_active = true
      AND nu.is_active = true
  )
  OR EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = 'admin'
  )
$$;

-- 3. Função para verificar acesso a módulo
CREATE OR REPLACE FUNCTION public.can_access_module(_user_id uuid, _module_code text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE 
    WHEN public.is_neohub_admin(_user_id) THEN true
    ELSE EXISTS (
      SELECT 1
      FROM public.neohub_module_permissions mp
      JOIN public.neohub_user_profiles nup ON nup.profile = mp.profile
      JOIN public.neohub_users nu ON nu.id = nup.neohub_user_id
      WHERE nu.user_id = _user_id
        AND mp.module_code = _module_code
        AND mp.can_read = true
        AND nup.is_active = true
        AND nu.is_active = true
    )
  END
$$;

-- 4. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_neohub_module_permissions_profile ON public.neohub_module_permissions(profile);
CREATE INDEX IF NOT EXISTS idx_neohub_module_permissions_module ON public.neohub_module_permissions(module_code);
CREATE INDEX IF NOT EXISTS idx_neohub_module_permissions_portal ON public.neohub_module_permissions(portal);

-- 5. Inserir permissões padrão - LICENCIADO
INSERT INTO public.neohub_module_permissions (profile, module_code, module_name, portal, can_read, can_write, can_delete) VALUES
('licenciado', 'neolicense_dashboard', 'Dashboard', 'neolicense', true, true, false),
('licenciado', 'neolicense_hotleads', 'HotLeads', 'neolicense', true, true, true),
('licenciado', 'neolicense_surgery', 'Agenda de Cirurgias', 'neolicense', true, true, true),
('licenciado', 'neolicense_materials', 'Central de Materiais', 'neolicense', true, false, false),
('licenciado', 'neolicense_marketing', 'Central de Marketing', 'neolicense', true, false, false),
('licenciado', 'neolicense_university', 'Universidade ByNeofolic', 'neolicense', true, false, false),
('licenciado', 'neolicense_certificates', 'Certificados', 'neolicense', true, false, false),
('licenciado', 'neolicense_partners', 'Vitrine de Parceiros', 'neolicense', true, false, false),
('licenciado', 'neolicense_store', 'Loja Neo-Spa', 'neolicense', true, true, false),
('licenciado', 'neolicense_support', 'Suporte e Mentoria', 'neolicense', true, true, false),
('licenciado', 'neolicense_gamification', 'Gamificação', 'neolicense', true, false, false),
('licenciado', 'neolicense_regularization', 'Regularização', 'neolicense', true, true, false),
('licenciado', 'neolicense_referral', 'Programa de Indicação', 'neolicense', true, true, false),
('licenciado', 'neolicense_profile', 'Perfil', 'neolicense', true, true, false)
ON CONFLICT (profile, module_code) DO NOTHING;

-- 6. Inserir permissões - COLABORADOR
INSERT INTO public.neohub_module_permissions (profile, module_code, module_name, portal, can_read, can_write, can_delete) VALUES
('colaborador', 'neoteam_schedule', 'Agenda', 'neoteam', true, true, false),
('colaborador', 'neoteam_waiting_room', 'Sala de Espera', 'neoteam', true, true, false),
('colaborador', 'neoteam_patients', 'Pacientes', 'neoteam', true, true, false),
('colaborador', 'neoteam_medical_records', 'Prontuários', 'neoteam', true, true, false),
('colaborador', 'neoteam_documents', 'Documentos', 'neoteam', true, false, false),
('colaborador', 'neoteam_materials', 'Materiais', 'neoteam', true, false, false),
('colaborador', 'neoteam_support', 'Suporte', 'neoteam', true, true, false),
('colaborador', 'neoteam_profile', 'Perfil', 'neoteam', true, true, false)
ON CONFLICT (profile, module_code) DO NOTHING;

-- 7. Inserir permissões - ALUNO
INSERT INTO public.neohub_module_permissions (profile, module_code, module_name, portal, can_read, can_write, can_delete) VALUES
('aluno', 'academy_courses', 'Cursos', 'academy', true, false, false),
('aluno', 'academy_lessons', 'Aulas', 'academy', true, false, false),
('aluno', 'academy_materials', 'Materiais Educacionais', 'academy', true, false, false),
('aluno', 'academy_quizzes', 'Quizzes', 'academy', true, true, false),
('aluno', 'academy_certificates', 'Certificados', 'academy', true, false, false),
('aluno', 'academy_community', 'Comunidade', 'academy', true, true, false),
('aluno', 'academy_career', 'Plano de Carreira', 'academy', true, false, false),
('aluno', 'academy_store', 'Loja Neo-Spa', 'academy', true, true, false),
('aluno', 'academy_profile', 'Perfil', 'academy', true, true, false)
ON CONFLICT (profile, module_code) DO NOTHING;

-- 8. Inserir permissões - PACIENTE
INSERT INTO public.neohub_module_permissions (profile, module_code, module_name, portal, can_read, can_write, can_delete) VALUES
('paciente', 'neocare_appointments', 'Agenda Pessoal', 'neocare', true, true, true),
('paciente', 'neocare_history', 'Histórico Clínico', 'neocare', true, false, false),
('paciente', 'neocare_documents', 'Documentos e Termos', 'neocare', true, true, false),
('paciente', 'neocare_payments', 'Pagamentos', 'neocare', true, true, false),
('paciente', 'neocare_teleconsultation', 'Teleconsulta', 'neocare', true, true, false),
('paciente', 'neocare_support', 'Suporte', 'neocare', true, true, false),
('paciente', 'neocare_store', 'Loja Neo-Spa', 'neocare', true, true, false),
('paciente', 'neocare_profile', 'Perfil', 'neocare', true, true, false)
ON CONFLICT (profile, module_code) DO NOTHING;

-- 9. Inserir permissões - CLIENTE_AVIVAR
INSERT INTO public.neohub_module_permissions (profile, module_code, module_name, portal, can_read, can_write, can_delete) VALUES
('cliente_avivar', 'avivar_dashboard', 'Dashboard Marketing', 'avivar', true, true, false),
('cliente_avivar', 'avivar_hotleads', 'HotLeads', 'avivar', true, true, true),
('cliente_avivar', 'avivar_traffic', 'Indicadores de Tráfego', 'avivar', true, false, false),
('cliente_avivar', 'avivar_marketing', 'Central de Marketing', 'avivar', true, true, false),
('cliente_avivar', 'avivar_mentorship', 'Mentoria Avivar', 'avivar', true, true, false),
('cliente_avivar', 'avivar_profile', 'Perfil', 'avivar', true, true, false)
ON CONFLICT (profile, module_code) DO NOTHING;