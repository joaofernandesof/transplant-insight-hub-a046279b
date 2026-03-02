
-- =============================================
-- STEP 1: Add new roles (Super Administrador, Visualizador)
-- =============================================
INSERT INTO public.roles (name, display_name, description, hierarchy_level, is_system)
VALUES
  ('super_administrador', 'Super Administrador', 'Acesso total e irrestrito ao sistema. Uso raríssimo.', 0, true),
  ('visualizador', 'Visualizador', 'Acesso somente leitura controlado por módulo.', 6, true)
ON CONFLICT DO NOTHING;

-- =============================================
-- STEP 2: Update hierarchy levels for standard roles
-- =============================================
UPDATE public.roles SET hierarchy_level = 1, description = 'Administração por portal' WHERE name = 'administrador';
UPDATE public.roles SET hierarchy_level = 2 WHERE name = 'gerente';
UPDATE public.roles SET hierarchy_level = 3 WHERE name = 'coordenador';
UPDATE public.roles SET hierarchy_level = 4 WHERE name = 'supervisor';

-- Rename operacao → operador
UPDATE public.roles SET name = 'operador', display_name = 'Operador', description = 'Acesso operacional padrão', hierarchy_level = 5 WHERE name = 'operacao';

-- Update externo hierarchy
UPDATE public.roles SET hierarchy_level = 7 WHERE name = 'externo';

-- =============================================
-- STEP 3: Remap business-specific roles to Operador
-- Reassign all user_portal_roles from deprecated roles to operador
-- =============================================

-- Get operador role id
DO $$
DECLARE
  operador_id UUID;
  deprecated_role RECORD;
BEGIN
  SELECT id INTO operador_id FROM public.roles WHERE name = 'operador';

  FOR deprecated_role IN 
    SELECT id, name FROM public.roles 
    WHERE name IN ('licenciado', 'medico', 'colaborador', 'aluno', 'paciente', 'cliente_avivar', 'ipromed')
  LOOP
    -- Update user_portal_roles: reassign to operador
    -- Use ON CONFLICT-safe approach: delete duplicates first, then update
    -- First delete any that would cause duplicates (same user+portal already has operador)
    DELETE FROM public.user_portal_roles upr1
    WHERE upr1.role_id = deprecated_role.id
    AND EXISTS (
      SELECT 1 FROM public.user_portal_roles upr2 
      WHERE upr2.user_id = upr1.user_id 
      AND upr2.portal_id = upr1.portal_id 
      AND upr2.role_id = operador_id
    );
    
    -- Now safely update remaining
    UPDATE public.user_portal_roles SET role_id = operador_id WHERE role_id = deprecated_role.id;
  END LOOP;
END $$;

-- =============================================
-- STEP 4: Delete role_module_permissions for deprecated roles
-- =============================================
DELETE FROM public.role_module_permissions 
WHERE role_id IN (
  SELECT id FROM public.roles WHERE name IN ('licenciado', 'medico', 'colaborador', 'aluno', 'paciente', 'cliente_avivar', 'ipromed')
);

-- =============================================
-- STEP 5: Remove deprecated roles
-- =============================================
DELETE FROM public.roles WHERE name IN ('licenciado', 'medico', 'colaborador', 'aluno', 'paciente', 'cliente_avivar', 'ipromed');

-- =============================================
-- STEP 6: Create default role_module_permissions for new roles
-- Super Administrador gets full access to all modules
-- Visualizador gets view-only for all modules
-- =============================================
INSERT INTO public.role_module_permissions (role_id, module_id, can_view, can_create, can_edit, can_delete, can_approve, can_export, can_configure)
SELECT 
  (SELECT id FROM public.roles WHERE name = 'super_administrador'),
  m.id,
  true, true, true, true, true, true, true
FROM public.modules m
ON CONFLICT DO NOTHING;

INSERT INTO public.role_module_permissions (role_id, module_id, can_view, can_create, can_edit, can_delete, can_approve, can_export, can_configure)
SELECT 
  (SELECT id FROM public.roles WHERE name = 'visualizador'),
  m.id,
  true, false, false, false, false, false, false
FROM public.modules m
ON CONFLICT DO NOTHING;
