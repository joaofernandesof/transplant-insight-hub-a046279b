-- Fix admin management policies to use unified admin check (supports administrador profile)

-- neohub_users
DROP POLICY IF EXISTS "Admins can manage all users" ON public.neohub_users;
CREATE POLICY "Neohub admins can manage all users"
ON public.neohub_users
FOR ALL
TO authenticated
USING (public.is_neohub_admin(auth.uid()))
WITH CHECK (public.is_neohub_admin(auth.uid()));

-- neohub_user_profiles
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.neohub_user_profiles;
CREATE POLICY "Neohub admins can manage all profiles"
ON public.neohub_user_profiles
FOR ALL
TO authenticated
USING (public.is_neohub_admin(auth.uid()))
WITH CHECK (public.is_neohub_admin(auth.uid()));