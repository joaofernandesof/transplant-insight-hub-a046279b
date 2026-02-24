-- Fix admin_audit_log RLS to use unified admin check
DROP POLICY IF EXISTS "Admins can insert audit logs" ON public.admin_audit_log;
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.admin_audit_log;

CREATE POLICY "Admins can insert audit logs"
ON public.admin_audit_log
FOR INSERT
TO authenticated
WITH CHECK (public.is_neohub_admin(auth.uid()));

CREATE POLICY "Admins can view audit logs"
ON public.admin_audit_log
FOR SELECT
TO authenticated
USING (public.is_neohub_admin(auth.uid()));