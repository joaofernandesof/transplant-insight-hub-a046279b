-- =============================================
-- CORREÇÃO DE VULNERABILIDADES P0 - AUDITORIA 2026-01-26
-- =============================================

-- SEC-001: Corrigir RLS da tabela leads
-- Remover política permissiva e criar política restritiva
DROP POLICY IF EXISTS "Allow authenticated users to view leads" ON public.leads;
DROP POLICY IF EXISTS "Authenticated users can view all leads" ON public.leads;

CREATE POLICY "Staff can view leads based on role"
ON public.leads
FOR SELECT
TO authenticated
USING (
  public.is_neohub_admin(auth.uid())
  OR public.has_staff_role(auth.uid(), 'admin')
  OR public.has_staff_role(auth.uid(), 'gestao')
  OR public.has_staff_role(auth.uid(), 'comercial')
  OR claimed_by = auth.uid()
);

-- SEC-002: Corrigir RLS da tabela neohub_users
-- Usuários só podem ver seus próprios dados ou admins veem todos
DROP POLICY IF EXISTS "Users can view all neohub_users" ON public.neohub_users;
DROP POLICY IF EXISTS "Authenticated users can view neohub_users" ON public.neohub_users;

CREATE POLICY "Users can view own data or admins all"
ON public.neohub_users
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR public.is_neohub_admin(auth.uid())
);

-- SEC-003: Recriar view exam_questions_student SEM correct_answer
DROP VIEW IF EXISTS public.exam_questions_student;

CREATE VIEW public.exam_questions_student
WITH (security_invoker = true)
AS
SELECT 
  id,
  exam_id,
  question_text,
  question_type,
  options,
  order_index,
  points,
  created_at
  -- NOTA: correct_answer e explanation REMOVIDOS intencionalmente para segurança
FROM public.exam_questions;

-- Conceder permissões na view
GRANT SELECT ON public.exam_questions_student TO authenticated;

-- SEC-004: Recriar views com security_invoker=true
-- View gallery_photo_stats
DROP VIEW IF EXISTS public.gallery_photo_stats;

CREATE VIEW public.gallery_photo_stats
WITH (security_invoker = true)
AS
SELECT 
  gp.id as photo_id,
  gp.gallery_id,
  gp.full_url,
  gp.caption,
  gp.created_at,
  COUNT(gpa.id) FILTER (WHERE gpa.action_type = 'view') as view_count,
  COUNT(gpa.id) FILTER (WHERE gpa.action_type = 'download') as download_count
FROM public.course_gallery_photos gp
LEFT JOIN public.gallery_photo_analytics gpa ON gpa.photo_id = gp.id
GROUP BY gp.id, gp.gallery_id, gp.full_url, gp.caption, gp.created_at;

GRANT SELECT ON public.gallery_photo_stats TO authenticated;

-- View gallery_stats
DROP VIEW IF EXISTS public.gallery_stats;

CREATE VIEW public.gallery_stats
WITH (security_invoker = true)
AS
SELECT 
  cg.id as gallery_id,
  cg.title,
  cg.class_id,
  cg.photo_count,
  COUNT(DISTINCT gpa.user_id) as unique_viewers,
  COUNT(gpa.id) FILTER (WHERE gpa.action_type = 'view') as total_views,
  COUNT(gpa.id) FILTER (WHERE gpa.action_type = 'download') as total_downloads
FROM public.course_galleries cg
LEFT JOIN public.course_gallery_photos cgp ON cgp.gallery_id = cg.id
LEFT JOIN public.gallery_photo_analytics gpa ON gpa.photo_id = cgp.id
GROUP BY cg.id, cg.title, cg.class_id, cg.photo_count;

GRANT SELECT ON public.gallery_stats TO authenticated;

-- Comentário de auditoria
COMMENT ON POLICY "Staff can view leads based on role" ON public.leads IS 'SEC-001: Corrigido em 2026-01-26 - Restringe acesso a leads por role';
COMMENT ON POLICY "Users can view own data or admins all" ON public.neohub_users IS 'SEC-002: Corrigido em 2026-01-26 - Restringe acesso a dados pessoais';
COMMENT ON VIEW public.exam_questions_student IS 'SEC-003: Corrigido em 2026-01-26 - Remove correct_answer para evitar vazamento de gabarito';
COMMENT ON VIEW public.gallery_photo_stats IS 'SEC-004: Corrigido em 2026-01-26 - Adicionado security_invoker=true';
COMMENT ON VIEW public.gallery_stats IS 'SEC-004: Corrigido em 2026-01-26 - Adicionado security_invoker=true';