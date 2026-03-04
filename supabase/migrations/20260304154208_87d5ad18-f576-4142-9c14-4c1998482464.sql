
-- Create SECURITY DEFINER function to check NeoTeam membership (bypasses RLS on joined tables)
CREATE OR REPLACE FUNCTION public.is_active_neoteam_member(_auth_uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM neoteam_team_members ntm
    JOIN neohub_users nu ON nu.id = ntm.user_id
    WHERE nu.user_id = _auth_uid AND ntm.is_active = true
  )
$$;

-- Recreate SELECT policy using the SECURITY DEFINER function
DROP POLICY IF EXISTS "Staff and NeoTeam can view surgery tasks" ON public.surgery_tasks;
CREATE POLICY "Staff and NeoTeam can view surgery tasks"
ON public.surgery_tasks
FOR SELECT
TO public
USING (
  is_neohub_admin(auth.uid())
  OR EXISTS (
    SELECT 1 FROM staff_profiles
    WHERE staff_profiles.user_id = auth.uid() AND staff_profiles.is_active = true
  )
  OR is_active_neoteam_member(auth.uid())
);

-- Recreate UPDATE policy using the SECURITY DEFINER function
DROP POLICY IF EXISTS "Staff and NeoTeam can update surgery tasks" ON public.surgery_tasks;
CREATE POLICY "Staff and NeoTeam can update surgery tasks"
ON public.surgery_tasks
FOR UPDATE
TO public
USING (
  is_neohub_admin(auth.uid())
  OR EXISTS (
    SELECT 1 FROM staff_profiles
    WHERE staff_profiles.user_id = auth.uid() AND staff_profiles.is_active = true
  )
  OR is_active_neoteam_member(auth.uid())
);
