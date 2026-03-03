-- Update has_neohub_profile to also check allowed_portals as fallback
-- This fixes the issue where users migrated to RBAC roles (e.g., 'operador') 
-- no longer match legacy profile checks (e.g., 'ipromed')
CREATE OR REPLACE FUNCTION public.has_neohub_profile(_user_id uuid, _profile neohub_profile)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    -- Check 1: Legacy direct profile match
    SELECT 1
    FROM public.neohub_user_profiles nup
    JOIN public.neohub_users nu ON nu.id = nup.neohub_user_id
    WHERE nu.user_id = _user_id
      AND nup.profile = _profile
      AND nup.is_active = true
      AND nu.is_active = true
  )
  OR EXISTS (
    -- Check 2: Check allowed_portals with profile-to-portal mapping
    -- Maps legacy profile names to their portal keys in allowed_portals
    SELECT 1
    FROM public.neohub_users nu
    WHERE nu.user_id = _user_id
      AND nu.is_active = true
      AND (
        -- ipromed profile maps to 'ipromed' or 'cpg' portal
        (_profile = 'ipromed' AND (nu.allowed_portals @> ARRAY['ipromed'] OR nu.allowed_portals @> ARRAY['cpg']))
        -- colaborador profile maps to 'neoteam' portal
        OR (_profile = 'colaborador' AND nu.allowed_portals @> ARRAY['neoteam'])
        -- licenciado profile maps to 'neolicense' portal  
        OR (_profile = 'licenciado' AND nu.allowed_portals @> ARRAY['neolicense'])
        -- aluno profile maps to 'academy' or 'neoacademy' portal
        OR (_profile = 'aluno' AND (nu.allowed_portals @> ARRAY['academy'] OR nu.allowed_portals @> ARRAY['neoacademy']))
        -- cliente_avivar profile maps to 'avivar' portal
        OR (_profile = 'cliente_avivar' AND nu.allowed_portals @> ARRAY['avivar'])
        -- medico profile maps to 'neocare' or 'ibramec' portal
        OR (_profile = 'medico' AND (nu.allowed_portals @> ARRAY['neocare'] OR nu.allowed_portals @> ARRAY['ibramec']))
        -- paciente profile maps to 'neocare' portal
        OR (_profile = 'paciente' AND nu.allowed_portals @> ARRAY['neocare'])
      )
  )
  OR EXISTS (
    -- Check 3: Check user_portal_roles for portal access
    SELECT 1
    FROM public.user_portal_roles upr
    JOIN public.portals p ON p.id = upr.portal_id
    WHERE upr.user_id = _user_id
      AND upr.is_active = true
      AND (
        (_profile = 'ipromed' AND p.slug IN ('ipromed', 'cpg'))
        OR (_profile = 'colaborador' AND p.slug = 'neoteam')
        OR (_profile = 'licenciado' AND p.slug = 'neolicense')
        OR (_profile = 'aluno' AND p.slug IN ('academy', 'neoacademy'))
        OR (_profile = 'cliente_avivar' AND p.slug = 'avivar')
        OR (_profile = 'medico' AND p.slug IN ('neocare', 'ibramec'))
        OR (_profile = 'paciente' AND p.slug = 'neocare')
      )
  )
$$;