-- Allow Neohub administrators to see all Day 1 survey responses (for Event Organization dashboard)
CREATE POLICY "Admins can view all day1 surveys"
ON public.day1_satisfaction_surveys
FOR SELECT
TO authenticated
USING (
  public.is_neohub_admin(auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

-- Allow Neohub administrators to read user names/avatars needed by analytics dashboards
CREATE POLICY "Neohub admins can view all users"
ON public.neohub_users
FOR SELECT
TO authenticated
USING (
  public.is_neohub_admin(auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
);
