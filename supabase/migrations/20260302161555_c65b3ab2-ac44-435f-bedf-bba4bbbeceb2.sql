
-- ============================================
-- ETAPA 1A: Criar tabelas do novo RBAC
-- ============================================

-- 1. PORTAIS
CREATE TABLE public.portals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.portals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Portals readable by authenticated" ON public.portals FOR SELECT TO authenticated USING (true);
CREATE POLICY "Portals manageable by admins" ON public.portals FOR ALL TO authenticated
  USING (public.is_neohub_admin(auth.uid())) WITH CHECK (public.is_neohub_admin(auth.uid()));

-- 2. FUNÇÕES (Roles)
CREATE TABLE public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  is_system BOOLEAN NOT NULL DEFAULT false,
  hierarchy_level INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Roles readable by authenticated" ON public.roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Roles manageable by admins" ON public.roles FOR ALL TO authenticated
  USING (public.is_neohub_admin(auth.uid())) WITH CHECK (public.is_neohub_admin(auth.uid()));

-- 3. MÓDULOS
CREATE TABLE public.modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portal_id UUID NOT NULL REFERENCES public.portals(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Modules readable by authenticated" ON public.modules FOR SELECT TO authenticated USING (true);
CREATE POLICY "Modules manageable by admins" ON public.modules FOR ALL TO authenticated
  USING (public.is_neohub_admin(auth.uid())) WITH CHECK (public.is_neohub_admin(auth.uid()));

-- 4. VÍNCULO USUÁRIO-PORTAL-FUNÇÃO
CREATE TABLE public.user_portal_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.neohub_users(id) ON DELETE CASCADE,
  portal_id UUID NOT NULL REFERENCES public.portals(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  assigned_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, portal_id, role_id)
);
ALTER TABLE public.user_portal_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own portal roles" ON public.user_portal_roles FOR SELECT TO authenticated
  USING (user_id IN (SELECT id FROM public.neohub_users WHERE user_id = auth.uid()) OR public.is_neohub_admin(auth.uid()));
CREATE POLICY "Admins manage user portal roles" ON public.user_portal_roles FOR ALL TO authenticated
  USING (public.is_neohub_admin(auth.uid())) WITH CHECK (public.is_neohub_admin(auth.uid()));

-- 5. PERMISSÕES POR FUNÇÃO × MÓDULO
CREATE TABLE public.role_module_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  can_view BOOLEAN NOT NULL DEFAULT false,
  can_create BOOLEAN NOT NULL DEFAULT false,
  can_edit BOOLEAN NOT NULL DEFAULT false,
  can_delete BOOLEAN NOT NULL DEFAULT false,
  can_approve BOOLEAN NOT NULL DEFAULT false,
  can_export BOOLEAN NOT NULL DEFAULT false,
  can_configure BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(role_id, module_id)
);
ALTER TABLE public.role_module_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Role permissions readable by authenticated" ON public.role_module_permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Role permissions manageable by admins" ON public.role_module_permissions FOR ALL TO authenticated
  USING (public.is_neohub_admin(auth.uid())) WITH CHECK (public.is_neohub_admin(auth.uid()));

-- 6. ÍNDICES
CREATE INDEX idx_user_portal_roles_user ON public.user_portal_roles(user_id);
CREATE INDEX idx_user_portal_roles_portal ON public.user_portal_roles(portal_id);
CREATE INDEX idx_user_portal_roles_role ON public.user_portal_roles(role_id);
CREATE INDEX idx_role_module_permissions_role ON public.role_module_permissions(role_id);
CREATE INDEX idx_role_module_permissions_module ON public.role_module_permissions(module_id);
CREATE INDEX idx_modules_portal ON public.modules(portal_id);

-- 7. TRIGGERS para updated_at
CREATE TRIGGER update_portals_updated_at BEFORE UPDATE ON public.portals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON public.roles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_modules_updated_at BEFORE UPDATE ON public.modules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_portal_roles_updated_at BEFORE UPDATE ON public.user_portal_roles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_role_module_permissions_updated_at BEFORE UPDATE ON public.role_module_permissions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 8. SEED: Portais
INSERT INTO public.portals (name, slug, icon, order_index) VALUES
  ('Administrador', 'admin', 'Shield', 0),
  ('NeoTeam', 'neoteam', 'Users', 1),
  ('NeoCare', 'neocare', 'Heart', 2),
  ('NeoAcademy', 'academy', 'GraduationCap', 3),
  ('NeoLicense', 'neolicense', 'Award', 4),
  ('Avivar', 'avivar', 'Sparkles', 5),
  ('IPROMED', 'ipromed', 'Scale', 6),
  ('NeoRH', 'neorh', 'Briefcase', 7),
  ('NeoPay', 'neopay', 'CreditCard', 8),
  ('HotLeads', 'hotleads', 'Flame', 9),
  ('NeoHair', 'neohair', 'Scissors', 10),
  ('Vision', 'vision', 'Eye', 11);

-- 9. SEED: Funções (Roles)
INSERT INTO public.roles (name, display_name, description, is_system, hierarchy_level) VALUES
  ('administrador', 'Administrador', 'Acesso total ao sistema', true, 0),
  ('gerente', 'Gerente', 'Gestão de equipe e operações', true, 1),
  ('coordenador', 'Coordenador', 'Coordenação de áreas específicas', true, 2),
  ('supervisor', 'Supervisor', 'Supervisão operacional', true, 3),
  ('operacao', 'Operação', 'Acesso operacional padrão', true, 4),
  ('externo', 'Externo', 'Acesso limitado para usuários externos', true, 5),
  ('licenciado', 'Licenciado', 'Dono de clínica licenciada', true, 1),
  ('colaborador', 'Colaborador', 'Funcionário de clínica', true, 3),
  ('medico', 'Médico', 'Profissional médico', true, 2),
  ('aluno', 'Aluno', 'Estudante IBRAMEC', true, 4),
  ('paciente', 'Paciente', 'Paciente do sistema NeoCare', true, 5),
  ('cliente_avivar', 'Cliente Avivar', 'Cliente externo Avivar', true, 4),
  ('ipromed', 'Sócio IPROMED', 'Sócias e colaboradoras IPROMED', true, 3);

-- 10. SEED: Módulos (extraindo de neohub_module_permissions com cast)
INSERT INTO public.modules (portal_id, code, name, icon, order_index)
SELECT DISTINCT 
  p.id,
  nmp.module_code,
  nmp.module_name,
  NULL,
  ROW_NUMBER() OVER (PARTITION BY p.slug ORDER BY nmp.module_code)::int
FROM public.neohub_module_permissions nmp
JOIN public.portals p ON p.slug = nmp.portal
WHERE nmp.module_code IS NOT NULL
ON CONFLICT (code) DO NOTHING;

-- 11. SEED: Permissões por role×módulo (com cast do enum)
INSERT INTO public.role_module_permissions (role_id, module_id, can_view, can_create, can_edit, can_delete)
SELECT DISTINCT
  r.id,
  m.id,
  COALESCE(nmp.can_read, false),
  COALESCE(nmp.can_write, false),
  COALESCE(nmp.can_write, false),
  COALESCE(nmp.can_delete, false)
FROM public.neohub_module_permissions nmp
JOIN public.roles r ON r.name = nmp.profile::text
JOIN public.modules m ON m.code = nmp.module_code
WHERE nmp.module_code IS NOT NULL
ON CONFLICT (role_id, module_id) DO UPDATE SET
  can_view = EXCLUDED.can_view,
  can_create = EXCLUDED.can_create,
  can_edit = EXCLUDED.can_edit,
  can_delete = EXCLUDED.can_delete;

-- 12. SEED: Migrar user_portal_roles
INSERT INTO public.user_portal_roles (user_id, portal_id, role_id)
SELECT DISTINCT nu.id, p.id, r.id
FROM public.neohub_users nu
JOIN public.neohub_user_profiles nup ON nup.neohub_user_id = nu.id AND nup.is_active = true
JOIN public.roles r ON r.name = nup.profile::text
JOIN public.portals p ON p.slug = ANY(nu.allowed_portals)
WHERE nu.allowed_portals IS NOT NULL AND array_length(nu.allowed_portals, 1) > 0
ON CONFLICT (user_id, portal_id, role_id) DO NOTHING;

-- Admins no portal admin
INSERT INTO public.user_portal_roles (user_id, portal_id, role_id)
SELECT DISTINCT nu.id,
  (SELECT id FROM public.portals WHERE slug = 'admin'),
  (SELECT id FROM public.roles WHERE name = 'administrador')
FROM public.neohub_users nu
JOIN public.neohub_user_profiles nup ON nup.neohub_user_id = nu.id AND nup.is_active = true
WHERE nup.profile::text = 'administrador'
ON CONFLICT (user_id, portal_id, role_id) DO NOTHING;

-- 13. SECURITY DEFINER: Verificar acesso a portal
CREATE OR REPLACE FUNCTION public.user_has_portal_access(_auth_user_id UUID, _portal_slug TEXT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_portal_roles upr
    JOIN public.neohub_users nu ON nu.id = upr.user_id
    JOIN public.portals p ON p.id = upr.portal_id
    WHERE nu.user_id = _auth_user_id AND p.slug = _portal_slug AND upr.is_active = true AND p.is_active = true
  ) OR public.is_neohub_admin(_auth_user_id)
$$;

-- 14. SECURITY DEFINER: Verificar permissão em módulo
CREATE OR REPLACE FUNCTION public.user_has_module_permission(_auth_user_id UUID, _module_code TEXT, _action TEXT DEFAULT 'view')
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_neohub_admin(_auth_user_id) OR EXISTS (
    SELECT 1 FROM public.user_portal_roles upr
    JOIN public.neohub_users nu ON nu.id = upr.user_id
    JOIN public.role_module_permissions rmp ON rmp.role_id = upr.role_id
    JOIN public.modules m ON m.id = rmp.module_id
    WHERE nu.user_id = _auth_user_id AND m.code = _module_code AND upr.is_active = true AND m.is_active = true
      AND ((_action = 'view' AND rmp.can_view) OR (_action = 'create' AND rmp.can_create)
        OR (_action = 'edit' AND rmp.can_edit) OR (_action = 'delete' AND rmp.can_delete)
        OR (_action = 'approve' AND rmp.can_approve) OR (_action = 'export' AND rmp.can_export)
        OR (_action = 'configure' AND rmp.can_configure))
  )
$$;

-- 15. ATUALIZAR get_user_context()
CREATE OR REPLACE FUNCTION public.get_user_context()
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  result JSONB;
  v_neohub_user_id UUID;
  v_is_admin BOOLEAN;
  v_permissions TEXT[];
BEGIN
  SELECT id INTO v_neohub_user_id FROM public.neohub_users WHERE user_id = auth.uid() LIMIT 1;
  IF v_neohub_user_id IS NULL THEN RETURN NULL; END IF;
  v_is_admin := public.is_neohub_admin(auth.uid());
  
  SELECT COALESCE(array_agg(DISTINCT perm), ARRAY[]::text[]) INTO v_permissions FROM (
    SELECT m.code || ':read' as perm FROM public.user_portal_roles upr
    JOIN public.role_module_permissions rmp ON rmp.role_id = upr.role_id
    JOIN public.modules m ON m.id = rmp.module_id
    WHERE upr.user_id = v_neohub_user_id AND upr.is_active AND m.is_active AND rmp.can_view
    UNION ALL
    SELECT m.code || ':write' FROM public.user_portal_roles upr
    JOIN public.role_module_permissions rmp ON rmp.role_id = upr.role_id
    JOIN public.modules m ON m.id = rmp.module_id
    WHERE upr.user_id = v_neohub_user_id AND upr.is_active AND m.is_active AND (rmp.can_create OR rmp.can_edit)
    UNION ALL
    SELECT m.code || ':delete' FROM public.user_portal_roles upr
    JOIN public.role_module_permissions rmp ON rmp.role_id = upr.role_id
    JOIN public.modules m ON m.id = rmp.module_id
    WHERE upr.user_id = v_neohub_user_id AND upr.is_active AND m.is_active AND rmp.can_delete
    UNION ALL
    SELECT o.module_code || ':read' FROM public.neohub_user_module_overrides o
    WHERE o.user_id = v_neohub_user_id AND o.can_read AND (o.expires_at IS NULL OR o.expires_at > now())
    UNION ALL
    SELECT o.module_code || ':write' FROM public.neohub_user_module_overrides o
    WHERE o.user_id = v_neohub_user_id AND o.can_write AND (o.expires_at IS NULL OR o.expires_at > now())
    UNION ALL
    SELECT o.module_code || ':delete' FROM public.neohub_user_module_overrides o
    WHERE o.user_id = v_neohub_user_id AND o.can_delete AND (o.expires_at IS NULL OR o.expires_at > now())
  ) perms WHERE perm IS NOT NULL;
  
  SELECT jsonb_build_object(
    'user', (SELECT jsonb_build_object('id', nu.id, 'auth_id', nu.user_id, 'email', nu.email,
      'full_name', nu.full_name, 'avatar_url', nu.avatar_url, 'phone', nu.phone)
      FROM public.neohub_users nu WHERE nu.id = v_neohub_user_id),
    'is_admin', v_is_admin,
    'profiles', (SELECT COALESCE(jsonb_agg(DISTINCT jsonb_build_object(
      'key', r.name, 'name', r.display_name, 'tenant_id', NULL, 'clinic_id', NULL, 'unit_id', NULL
    )), '[]'::jsonb) FROM public.user_portal_roles upr JOIN public.roles r ON r.id = upr.role_id
      WHERE upr.user_id = v_neohub_user_id AND upr.is_active),
    'permissions', to_jsonb(v_permissions),
    'modules', (SELECT COALESCE(jsonb_agg(DISTINCT jsonb_build_object(
      'key', m.code, 'code', m.code, 'name', m.name, 'portal', p.slug
    )), '[]'::jsonb) FROM public.user_portal_roles upr
      JOIN public.role_module_permissions rmp ON rmp.role_id = upr.role_id
      JOIN public.modules m ON m.id = rmp.module_id
      JOIN public.portals p ON p.id = m.portal_id
      WHERE upr.user_id = v_neohub_user_id AND upr.is_active AND m.is_active AND rmp.can_view),
    'overrides', (SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'module_code', o.module_code, 'can_read', o.can_read, 'can_write', o.can_write,
      'can_delete', o.can_delete, 'reason', o.reason, 'expires_at', o.expires_at
    )), '[]'::jsonb) FROM public.neohub_user_module_overrides o
      WHERE o.user_id = v_neohub_user_id AND (o.expires_at IS NULL OR o.expires_at > now())),
    'tenants', (SELECT COALESCE(jsonb_agg(DISTINCT jsonb_build_object(
      'id', t.id, 'name', t.name, 'slug', t.slug
    )), '[]'::jsonb) FROM public.user_profile_assignments upa
      JOIN public.tenants t ON t.id = upa.tenant_id WHERE upa.user_id = v_neohub_user_id),
    'portals', (SELECT COALESCE(jsonb_agg(DISTINCT jsonb_build_object(
      'portal_id', p.id, 'portal_slug', p.slug, 'portal_name', p.name,
      'role_id', r.id, 'role_name', r.name, 'role_display_name', r.display_name
    )), '[]'::jsonb) FROM public.user_portal_roles upr
      JOIN public.portals p ON p.id = upr.portal_id JOIN public.roles r ON r.id = upr.role_id
      WHERE upr.user_id = v_neohub_user_id AND upr.is_active AND p.is_active)
  ) INTO result;
  RETURN result;
END;
$$;
