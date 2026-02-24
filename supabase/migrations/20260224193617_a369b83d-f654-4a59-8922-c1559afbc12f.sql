
-- Drop existing policy
DROP POLICY IF EXISTS "Only admins can manage roles" ON public.user_roles;

-- Recreate with is_neohub_admin check (covers both user_roles admin AND neohub_user_profiles administrador)
CREATE POLICY "Only admins can manage roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.is_neohub_admin(auth.uid()))
WITH CHECK (public.is_neohub_admin(auth.uid()));
