-- ============================================
-- FASE 1: NOVA ARQUITETURA DE PERMISSÕES
-- Multi-tenant com migração de dados
-- ============================================

-- 1. TABELA TENANTS (organizações/clínicas)
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. TABELA PROFILES (definições de perfil - não usuários)
CREATE TABLE IF NOT EXISTS public.profile_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL, -- 'admin', 'colaborador', 'medico', 'paciente', 'aluno', 'licenciado'
  name TEXT NOT NULL,
  description TEXT,
  is_system BOOLEAN DEFAULT false, -- perfis do sistema não podem ser deletados
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. TABELA PERMISSIONS (permissões atômicas)
CREATE TABLE IF NOT EXISTS public.permission_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL, -- 'operation.view', 'commercial.crm', 'admin.manage'
  name TEXT NOT NULL,
  description TEXT,
  module TEXT NOT NULL, -- agrupa por módulo
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. TABELA MODULES (módulos funcionais)
CREATE TABLE IF NOT EXISTS public.module_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL, -- 'core', 'operation', 'commercial', 'analytic', 'education', 'licensing', 'admin'
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  order_index INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. TABELA PROFILE_PERMISSIONS (permissões por perfil)
CREATE TABLE IF NOT EXISTS public.profile_permission_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profile_definitions(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permission_definitions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(profile_id, permission_id)
);

-- 6. TABELA USER_PROFILE_ASSIGNMENTS (usuário -> perfil + escopo)
CREATE TABLE IF NOT EXISTS public.user_profile_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.neohub_users(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profile_definitions(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  clinic_id UUID, -- escopo opcional para clínica específica
  unit_id UUID, -- escopo opcional para unidade específica
  is_active BOOLEAN DEFAULT true,
  granted_at TIMESTAMPTZ DEFAULT now(),
  granted_by UUID,
  UNIQUE(user_id, profile_id, tenant_id, clinic_id, unit_id)
);

-- 7. TABELA USER_PERMISSION_OVERRIDES (exceções de permissão)
CREATE TABLE IF NOT EXISTS public.user_permission_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.neohub_users(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permission_definitions(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id),
  clinic_id UUID,
  unit_id UUID,
  is_granted BOOLEAN DEFAULT true, -- true = concede, false = revoga
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, permission_id, tenant_id, clinic_id, unit_id)
);

-- 8. TABELA TENANT_MODULES (módulos ativos por tenant)
CREATE TABLE IF NOT EXISTS public.tenant_module_activations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.module_definitions(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  activated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, module_id)
);

-- ============================================
-- SEEDS: DADOS INICIAIS
-- ============================================

-- Perfis padrão do sistema
INSERT INTO public.profile_definitions (key, name, description, is_system) VALUES
  ('administrador', 'Administrador', 'Acesso total ao sistema', true),
  ('licenciado', 'Licenciado', 'Dono de clínica licenciada', true),
  ('colaborador', 'Colaborador', 'Funcionário de clínica', true),
  ('medico', 'Médico', 'Profissional médico', true),
  ('aluno', 'Aluno', 'Estudante IBRAMEC', true),
  ('paciente', 'Paciente', 'Paciente do sistema NeoCare', true),
  ('cliente_avivar', 'Cliente Avivar', 'Cliente externo Avivar', true)
ON CONFLICT (key) DO NOTHING;

-- Módulos do sistema
INSERT INTO public.module_definitions (key, name, description, icon, order_index) VALUES
  ('core', 'Core', 'Funcionalidades básicas', 'Settings', 0),
  ('operation', 'Operação', 'Gestão operacional clínica', 'Building2', 1),
  ('commercial', 'Comercial', 'CRM e vendas', 'DollarSign', 2),
  ('analytic', 'Análises', 'Dashboards e relatórios', 'BarChart3', 3),
  ('education', 'Educação', 'Universidade e cursos', 'GraduationCap', 4),
  ('licensing', 'Licenciamento', 'Gestão de licenças', 'Award', 5),
  ('admin', 'Administração', 'Configurações globais', 'Shield', 6)
ON CONFLICT (key) DO NOTHING;

-- Permissões atômicas
INSERT INTO public.permission_definitions (key, name, description, module) VALUES
  -- Core
  ('core.view', 'Visualizar Core', 'Acesso básico ao sistema', 'core'),
  ('core.profile', 'Gerenciar Perfil', 'Editar próprio perfil', 'core'),
  
  -- Operation
  ('operation.view', 'Visualizar Operação', 'Ver agenda e atendimentos', 'operation'),
  ('operation.manage', 'Gerenciar Operação', 'Criar e editar agendamentos', 'operation'),
  ('operation.waiting_room', 'Sala de Espera', 'Gerenciar fila de atendimento', 'operation'),
  ('operation.surgery', 'Cirurgias', 'Gerenciar agenda cirúrgica', 'operation'),
  
  -- Commercial
  ('commercial.view', 'Visualizar Comercial', 'Ver CRM e leads', 'commercial'),
  ('commercial.crm', 'CRM Completo', 'Gerenciar leads e vendas', 'commercial'),
  ('commercial.hotleads', 'HotLeads', 'Acesso a leads quentes', 'commercial'),
  ('commercial.results', 'Resultados', 'Ver VGV e métricas', 'commercial'),
  
  -- Analytic
  ('analytic.view', 'Visualizar Análises', 'Ver dashboards básicos', 'analytic'),
  ('analytic.reports', 'Relatórios', 'Gerar relatórios', 'analytic'),
  ('analytic.comparison', 'Comparar Clínicas', 'Benchmark entre unidades', 'analytic'),
  
  -- Education
  ('education.view', 'Visualizar Educação', 'Acessar cursos', 'education'),
  ('education.manage', 'Gerenciar Educação', 'Criar e editar cursos', 'education'),
  ('education.exams', 'Provas', 'Gerenciar avaliações', 'education'),
  
  -- Licensing
  ('licensing.view', 'Visualizar Licenciamento', 'Ver dados de licenciados', 'licensing'),
  ('licensing.manage', 'Gerenciar Licenciados', 'Criar e editar licenciados', 'licensing'),
  
  -- Admin
  ('admin.view', 'Visualizar Admin', 'Acesso ao painel admin', 'admin'),
  ('admin.manage', 'Gerenciar Sistema', 'Configurações globais', 'admin'),
  ('admin.users', 'Gerenciar Usuários', 'CRUD de usuários', 'admin'),
  ('admin.permissions', 'Gerenciar Permissões', 'Matriz de acessos', 'admin'),
  ('admin.sentinel', 'System Sentinel', 'Monitoramento técnico', 'admin')
ON CONFLICT (key) DO NOTHING;

-- Permissões do perfil Administrador (todas)
INSERT INTO public.profile_permission_mappings (profile_id, permission_id)
SELECT p.id, perm.id
FROM public.profile_definitions p
CROSS JOIN public.permission_definitions perm
WHERE p.key = 'administrador'
ON CONFLICT DO NOTHING;

-- Permissões do perfil Licenciado
INSERT INTO public.profile_permission_mappings (profile_id, permission_id)
SELECT p.id, perm.id
FROM public.profile_definitions p
CROSS JOIN public.permission_definitions perm
WHERE p.key = 'licenciado' 
  AND perm.key IN (
    'core.view', 'core.profile',
    'operation.view', 'operation.manage', 'operation.surgery',
    'commercial.view', 'commercial.crm', 'commercial.results',
    'analytic.view', 'analytic.reports',
    'education.view'
  )
ON CONFLICT DO NOTHING;

-- Permissões do perfil Colaborador
INSERT INTO public.profile_permission_mappings (profile_id, permission_id)
SELECT p.id, perm.id
FROM public.profile_definitions p
CROSS JOIN public.permission_definitions perm
WHERE p.key = 'colaborador' 
  AND perm.key IN (
    'core.view', 'core.profile',
    'operation.view', 'operation.manage', 'operation.waiting_room',
    'commercial.view'
  )
ON CONFLICT DO NOTHING;

-- Permissões do perfil Médico
INSERT INTO public.profile_permission_mappings (profile_id, permission_id)
SELECT p.id, perm.id
FROM public.profile_definitions p
CROSS JOIN public.permission_definitions perm
WHERE p.key = 'medico' 
  AND perm.key IN (
    'core.view', 'core.profile',
    'operation.view', 'operation.manage', 'operation.surgery', 'operation.waiting_room'
  )
ON CONFLICT DO NOTHING;

-- Permissões do perfil Aluno
INSERT INTO public.profile_permission_mappings (profile_id, permission_id)
SELECT p.id, perm.id
FROM public.profile_definitions p
CROSS JOIN public.permission_definitions perm
WHERE p.key = 'aluno' 
  AND perm.key IN (
    'core.view', 'core.profile',
    'education.view'
  )
ON CONFLICT DO NOTHING;

-- Permissões do perfil Paciente
INSERT INTO public.profile_permission_mappings (profile_id, permission_id)
SELECT p.id, perm.id
FROM public.profile_definitions p
CROSS JOIN public.permission_definitions perm
WHERE p.key = 'paciente' 
  AND perm.key IN (
    'core.view', 'core.profile'
  )
ON CONFLICT DO NOTHING;

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permission_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_permission_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profile_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permission_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_module_activations ENABLE ROW LEVEL SECURITY;

-- Definitions são públicas para leitura (necessário para o frontend)
CREATE POLICY "Profile definitions are viewable by authenticated" ON public.profile_definitions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Permission definitions are viewable by authenticated" ON public.permission_definitions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Module definitions are viewable by authenticated" ON public.module_definitions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Profile permissions are viewable by authenticated" ON public.profile_permission_mappings
  FOR SELECT USING (auth.role() = 'authenticated');

-- User assignments: usuário vê os próprios
CREATE POLICY "Users can view own profile assignments" ON public.user_profile_assignments
  FOR SELECT USING (
    user_id IN (SELECT id FROM public.neohub_users WHERE user_id = auth.uid())
    OR public.is_neohub_admin(auth.uid())
  );

CREATE POLICY "Admins can manage profile assignments" ON public.user_profile_assignments
  FOR ALL USING (public.is_neohub_admin(auth.uid()));

-- User permission overrides
CREATE POLICY "Users can view own permission overrides" ON public.user_permission_overrides
  FOR SELECT USING (
    user_id IN (SELECT id FROM public.neohub_users WHERE user_id = auth.uid())
    OR public.is_neohub_admin(auth.uid())
  );

CREATE POLICY "Admins can manage permission overrides" ON public.user_permission_overrides
  FOR ALL USING (public.is_neohub_admin(auth.uid()));

-- Tenants
CREATE POLICY "Tenants viewable by members" ON public.tenants
  FOR SELECT USING (
    id IN (
      SELECT upa.tenant_id FROM public.user_profile_assignments upa
      JOIN public.neohub_users nu ON nu.id = upa.user_id
      WHERE nu.user_id = auth.uid()
    )
    OR public.is_neohub_admin(auth.uid())
  );

CREATE POLICY "Admins can manage tenants" ON public.tenants
  FOR ALL USING (public.is_neohub_admin(auth.uid()));

-- Tenant module activations
CREATE POLICY "Tenant modules viewable by members" ON public.tenant_module_activations
  FOR SELECT USING (
    tenant_id IN (
      SELECT upa.tenant_id FROM public.user_profile_assignments upa
      JOIN public.neohub_users nu ON nu.id = upa.user_id
      WHERE nu.user_id = auth.uid()
    )
    OR public.is_neohub_admin(auth.uid())
  );

CREATE POLICY "Admins can manage tenant modules" ON public.tenant_module_activations
  FOR ALL USING (public.is_neohub_admin(auth.uid()));

-- ============================================
-- FUNÇÃO auth.me() - RETORNA CONTEXTO DO USUÁRIO
-- ============================================

CREATE OR REPLACE FUNCTION public.get_user_context()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result JSONB;
  v_neohub_user_id UUID;
BEGIN
  -- Get neohub user id
  SELECT id INTO v_neohub_user_id
  FROM public.neohub_users
  WHERE user_id = auth.uid()
  LIMIT 1;
  
  IF v_neohub_user_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  SELECT jsonb_build_object(
    'user', (
      SELECT jsonb_build_object(
        'id', nu.id,
        'auth_id', nu.user_id,
        'email', nu.email,
        'full_name', nu.full_name,
        'avatar_url', nu.avatar_url,
        'phone', nu.phone
      )
      FROM public.neohub_users nu
      WHERE nu.id = v_neohub_user_id
    ),
    'profiles', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'key', pd.key,
        'name', pd.name,
        'tenant_id', upa.tenant_id,
        'clinic_id', upa.clinic_id,
        'unit_id', upa.unit_id
      )), '[]'::jsonb)
      FROM public.user_profile_assignments upa
      JOIN public.profile_definitions pd ON pd.id = upa.profile_id
      WHERE upa.user_id = v_neohub_user_id AND upa.is_active = true
    ),
    'permissions', (
      SELECT COALESCE(array_agg(DISTINCT perm.key), ARRAY[]::text[])
      FROM public.user_profile_assignments upa
      JOIN public.profile_permission_mappings ppm ON ppm.profile_id = upa.profile_id
      JOIN public.permission_definitions perm ON perm.id = ppm.permission_id
      WHERE upa.user_id = v_neohub_user_id AND upa.is_active = true
      
      UNION
      
      SELECT COALESCE(array_agg(perm.key), ARRAY[]::text[])
      FROM public.user_permission_overrides upo
      JOIN public.permission_definitions perm ON perm.id = upo.permission_id
      WHERE upo.user_id = v_neohub_user_id AND upo.is_granted = true
    ),
    'modules', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'key', md.key,
        'name', md.name,
        'icon', md.icon
      )), '[]'::jsonb)
      FROM public.module_definitions md
      WHERE md.is_active = true
    ),
    'tenants', (
      SELECT COALESCE(jsonb_agg(DISTINCT jsonb_build_object(
        'id', t.id,
        'name', t.name,
        'slug', t.slug
      )), '[]'::jsonb)
      FROM public.user_profile_assignments upa
      JOIN public.tenants t ON t.id = upa.tenant_id
      WHERE upa.user_id = v_neohub_user_id AND upa.is_active = true AND t.is_active = true
    )
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Função helper para verificar permissão
CREATE OR REPLACE FUNCTION public.user_has_permission(_permission_key TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.neohub_users nu
    JOIN public.user_profile_assignments upa ON upa.user_id = nu.id
    JOIN public.profile_permission_mappings ppm ON ppm.profile_id = upa.profile_id
    JOIN public.permission_definitions perm ON perm.id = ppm.permission_id
    WHERE nu.user_id = auth.uid()
      AND upa.is_active = true
      AND perm.key = _permission_key
  )
  OR EXISTS (
    SELECT 1
    FROM public.neohub_users nu
    JOIN public.user_permission_overrides upo ON upo.user_id = nu.id
    JOIN public.permission_definitions perm ON perm.id = upo.permission_id
    WHERE nu.user_id = auth.uid()
      AND upo.is_granted = true
      AND perm.key = _permission_key
  );
$$;

-- Função helper para verificar perfil
CREATE OR REPLACE FUNCTION public.user_has_profile(_profile_key TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.neohub_users nu
    JOIN public.user_profile_assignments upa ON upa.user_id = nu.id
    JOIN public.profile_definitions pd ON pd.id = upa.profile_id
    WHERE nu.user_id = auth.uid()
      AND upa.is_active = true
      AND pd.key = _profile_key
  );
$$;

-- Triggers para updated_at
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();