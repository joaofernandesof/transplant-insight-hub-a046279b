
-- ============================================
-- MIGRAÇÃO: Arquitetura Academy Multi-Empresa
-- ============================================

-- 1. Criar novos perfis específicos por Academy (se não existirem)
INSERT INTO profile_definitions (key, name, description, is_system)
VALUES 
  ('aluno_ibramec', 'Aluno IBRAMEC', 'Estudante da formação IBRAMEC', true),
  ('licenciado_byneofolic', 'Licenciado ByNeofolic', 'Licenciado da marca ByNeofolic', true),
  ('cliente_avivar', 'Cliente Avivar', 'Cliente do programa Avivar', true),
  ('colaborador_neofolic', 'Colaborador NeoFolic', 'Colaborador interno NeoFolic', true)
ON CONFLICT (key) DO NOTHING;

-- 2. Criar tabela de overrides manuais de módulos por usuário
CREATE TABLE IF NOT EXISTS neohub_user_module_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES neohub_users(id) ON DELETE CASCADE,
  module_code TEXT NOT NULL,
  can_read BOOLEAN DEFAULT false,
  can_write BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, module_code)
);

-- 3. Adicionar índices para performance
CREATE INDEX IF NOT EXISTS idx_user_module_overrides_user ON neohub_user_module_overrides(user_id);
CREATE INDEX IF NOT EXISTS idx_user_module_overrides_module ON neohub_user_module_overrides(module_code);

-- 4. Habilitar RLS
ALTER TABLE neohub_user_module_overrides ENABLE ROW LEVEL SECURITY;

-- 5. Políticas RLS
CREATE POLICY "Admins can manage all overrides"
ON neohub_user_module_overrides
FOR ALL
USING (public.is_neohub_admin(auth.uid()));

CREATE POLICY "Users can view own overrides"
ON neohub_user_module_overrides
FOR SELECT
USING (user_id IN (SELECT id FROM neohub_users WHERE user_id = auth.uid()));

-- 6. Inserir os módulos Academy segmentados na matriz
INSERT INTO neohub_module_permissions (profile, module_code, module_name, portal, can_read, can_write, can_delete)
VALUES
  -- Academy IBRAMEC (apenas aluno IBRAMEC)
  ('aluno'::neohub_profile, 'academy_ibramec', 'Academy IBRAMEC', 'academy', true, false, false),
  
  -- Academy ByNeofolic (apenas licenciados)
  ('licenciado'::neohub_profile, 'academy_byneofolic', 'Academy ByNeofolic', 'academy', true, false, false),
  
  -- Academy Avivar (apenas clientes Avivar)
  ('cliente_avivar'::neohub_profile, 'academy_avivar', 'Academy Avivar', 'academy', true, false, false),
  
  -- Academy Operação NeoFolic (apenas colaboradores)
  ('colaborador'::neohub_profile, 'academy_operacao_neofolic', 'Academy Operação NeoFolic', 'academy', true, false, false)
ON CONFLICT DO NOTHING;

-- 7. Criar ou atualizar função get_user_context com suporte a overrides
CREATE OR REPLACE FUNCTION public.get_user_context()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  result JSONB;
  v_neohub_user_id UUID;
  v_is_admin BOOLEAN;
  v_permissions TEXT[];
BEGIN
  -- Get neohub user id
  SELECT id INTO v_neohub_user_id
  FROM public.neohub_users
  WHERE user_id = auth.uid()
  LIMIT 1;
  
  IF v_neohub_user_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Check if admin
  v_is_admin := public.is_neohub_admin(auth.uid());
  
  -- Build permissions array: format = "module_code:action"
  -- 1. From profile-based permissions
  SELECT COALESCE(array_agg(DISTINCT perm), ARRAY[]::text[])
  INTO v_permissions
  FROM (
    -- Permissões baseadas em perfil (nova arquitetura profile_definitions)
    SELECT 
      CASE 
        WHEN mp.can_read THEN mp.module_code || ':read'
      END as perm
    FROM public.neohub_module_permissions mp
    JOIN public.neohub_user_profiles nup ON nup.profile::text = mp.profile::text
    JOIN public.neohub_users nu ON nu.id = nup.neohub_user_id
    WHERE nu.id = v_neohub_user_id
      AND nup.is_active = true
      AND mp.can_read = true
    
    UNION ALL
    
    SELECT 
      CASE 
        WHEN mp.can_write THEN mp.module_code || ':write'
      END as perm
    FROM public.neohub_module_permissions mp
    JOIN public.neohub_user_profiles nup ON nup.profile::text = mp.profile::text
    JOIN public.neohub_users nu ON nu.id = nup.neohub_user_id
    WHERE nu.id = v_neohub_user_id
      AND nup.is_active = true
      AND mp.can_write = true
    
    UNION ALL
    
    SELECT 
      CASE 
        WHEN mp.can_delete THEN mp.module_code || ':delete'
      END as perm
    FROM public.neohub_module_permissions mp
    JOIN public.neohub_user_profiles nup ON nup.profile::text = mp.profile::text
    JOIN public.neohub_users nu ON nu.id = nup.neohub_user_id
    WHERE nu.id = v_neohub_user_id
      AND nup.is_active = true
      AND mp.can_delete = true
    
    UNION ALL
    
    -- Overrides manuais (tem prioridade)
    SELECT o.module_code || ':read' as perm
    FROM public.neohub_user_module_overrides o
    WHERE o.user_id = v_neohub_user_id
      AND o.can_read = true
      AND (o.expires_at IS NULL OR o.expires_at > now())
    
    UNION ALL
    
    SELECT o.module_code || ':write' as perm
    FROM public.neohub_user_module_overrides o
    WHERE o.user_id = v_neohub_user_id
      AND o.can_write = true
      AND (o.expires_at IS NULL OR o.expires_at > now())
    
    UNION ALL
    
    SELECT o.module_code || ':delete' as perm
    FROM public.neohub_user_module_overrides o
    WHERE o.user_id = v_neohub_user_id
      AND o.can_delete = true
      AND (o.expires_at IS NULL OR o.expires_at > now())
  ) perms
  WHERE perm IS NOT NULL;
  
  -- Build final result
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
    'is_admin', v_is_admin,
    'profiles', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'key', nup.profile::text,
        'name', COALESCE(pd.name, initcap(nup.profile::text)),
        'tenant_id', upa.tenant_id,
        'clinic_id', upa.clinic_id,
        'unit_id', upa.unit_id
      )), '[]'::jsonb)
      FROM public.neohub_user_profiles nup
      JOIN public.neohub_users nu ON nu.id = nup.neohub_user_id
      LEFT JOIN public.profile_definitions pd ON pd.key = nup.profile::text
      LEFT JOIN public.user_profile_assignments upa ON upa.user_id = nu.id AND upa.profile_id = pd.id
      WHERE nu.id = v_neohub_user_id AND nup.is_active = true
    ),
    'permissions', to_jsonb(v_permissions),
    'modules', (
      SELECT COALESCE(jsonb_agg(DISTINCT jsonb_build_object(
        'code', mp.module_code,
        'name', mp.module_name,
        'portal', mp.portal
      )), '[]'::jsonb)
      FROM public.neohub_module_permissions mp
      JOIN public.neohub_user_profiles nup ON nup.profile::text = mp.profile::text
      JOIN public.neohub_users nu ON nu.id = nup.neohub_user_id
      WHERE nu.id = v_neohub_user_id
        AND nup.is_active = true
        AND mp.can_read = true
      
      UNION
      
      -- Módulos de overrides
      SELECT jsonb_build_object(
        'code', o.module_code,
        'name', COALESCE(
          (SELECT module_name FROM neohub_module_permissions WHERE module_code = o.module_code LIMIT 1),
          o.module_code
        ),
        'portal', COALESCE(
          (SELECT portal FROM neohub_module_permissions WHERE module_code = o.module_code LIMIT 1),
          'academy'
        )
      )
      FROM public.neohub_user_module_overrides o
      WHERE o.user_id = v_neohub_user_id
        AND o.can_read = true
        AND (o.expires_at IS NULL OR o.expires_at > now())
    ),
    'overrides', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'module_code', o.module_code,
        'can_read', o.can_read,
        'can_write', o.can_write,
        'can_delete', o.can_delete,
        'reason', o.reason,
        'expires_at', o.expires_at
      )), '[]'::jsonb)
      FROM public.neohub_user_module_overrides o
      WHERE o.user_id = v_neohub_user_id
        AND (o.expires_at IS NULL OR o.expires_at > now())
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
$function$;

-- 8. Criar função auxiliar para verificar acesso a módulo
CREATE OR REPLACE FUNCTION public.can_access_module_with_action(_user_id UUID, _module_code TEXT, _action TEXT DEFAULT 'read')
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT CASE 
    WHEN public.is_neohub_admin(_user_id) THEN true
    ELSE (
      -- Verificar override primeiro (tem prioridade)
      EXISTS (
        SELECT 1
        FROM public.neohub_user_module_overrides o
        JOIN public.neohub_users nu ON nu.id = o.user_id
        WHERE nu.user_id = _user_id
          AND o.module_code = _module_code
          AND (o.expires_at IS NULL OR o.expires_at > now())
          AND CASE _action
            WHEN 'read' THEN o.can_read
            WHEN 'write' THEN o.can_write
            WHEN 'delete' THEN o.can_delete
            ELSE o.can_read
          END = true
      )
      OR
      -- Verificar permissão por perfil
      EXISTS (
        SELECT 1
        FROM public.neohub_module_permissions mp
        JOIN public.neohub_user_profiles nup ON nup.profile::text = mp.profile::text
        JOIN public.neohub_users nu ON nu.id = nup.neohub_user_id
        WHERE nu.user_id = _user_id
          AND mp.module_code = _module_code
          AND nup.is_active = true
          AND CASE _action
            WHEN 'read' THEN mp.can_read
            WHEN 'write' THEN mp.can_write
            WHEN 'delete' THEN mp.can_delete
            ELSE mp.can_read
          END = true
      )
    )
  END
$function$;

-- 9. Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_neohub_override_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_neohub_override_timestamp ON neohub_user_module_overrides;
CREATE TRIGGER update_neohub_override_timestamp
BEFORE UPDATE ON neohub_user_module_overrides
FOR EACH ROW
EXECUTE FUNCTION update_neohub_override_updated_at();
