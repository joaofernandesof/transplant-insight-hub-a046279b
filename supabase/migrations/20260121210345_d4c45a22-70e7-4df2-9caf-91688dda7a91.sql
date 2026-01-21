-- ============================================
-- FASE 2: MIGRAÇÃO DE DADOS EXISTENTES
-- ============================================

-- 1. Criar tenant padrão (Neo Group)
INSERT INTO public.tenants (id, name, slug, is_active)
VALUES ('00000000-0000-0000-0000-000000000001', 'Neo Group', 'neo-group', true)
ON CONFLICT DO NOTHING;

-- 2. Ativar todos os módulos para o tenant padrão
INSERT INTO public.tenant_module_activations (tenant_id, module_id, is_active)
SELECT '00000000-0000-0000-0000-000000000001', id, true
FROM public.module_definitions
ON CONFLICT DO NOTHING;

-- 3. Migrar user_profiles existentes para nova estrutura
INSERT INTO public.user_profile_assignments (user_id, profile_id, tenant_id, is_active, granted_at)
SELECT 
  nup.neohub_user_id,
  pd.id,
  '00000000-0000-0000-0000-000000000001'::uuid,
  nup.is_active,
  COALESCE(nup.granted_at, now())
FROM public.neohub_user_profiles nup
JOIN public.profile_definitions pd ON pd.key = nup.profile::text
WHERE nup.neohub_user_id IS NOT NULL
ON CONFLICT (user_id, profile_id, tenant_id, clinic_id, unit_id) DO NOTHING;

-- 4. Garantir que o admin principal tenha o perfil administrador
INSERT INTO public.user_profile_assignments (user_id, profile_id, tenant_id, is_active, granted_at)
SELECT 
  nu.id,
  pd.id,
  '00000000-0000-0000-0000-000000000001'::uuid,
  true,
  now()
FROM public.neohub_users nu
CROSS JOIN public.profile_definitions pd
WHERE nu.email = 'adm@neofolic.com.br' AND pd.key = 'administrador'
ON CONFLICT (user_id, profile_id, tenant_id, clinic_id, unit_id) DO NOTHING;

-- 5. Criar tenants para clínicas existentes
INSERT INTO public.tenants (name, slug)
SELECT DISTINCT 
  nu.clinic_name,
  LOWER(REGEXP_REPLACE(nu.clinic_name, '[^a-zA-Z0-9]', '-', 'g'))
FROM public.neohub_users nu
WHERE nu.clinic_name IS NOT NULL 
  AND nu.clinic_name != ''
  AND NOT EXISTS (SELECT 1 FROM public.tenants t WHERE t.name = nu.clinic_name)
ON CONFLICT (slug) DO NOTHING;