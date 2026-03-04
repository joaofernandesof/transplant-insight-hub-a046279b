
-- Fix SELECT policy: neoteam_team_members.user_id references neohub_users.id, not auth.uid()
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
  OR EXISTS (
    SELECT 1 FROM neoteam_team_members ntm
    JOIN neohub_users nu ON nu.id = ntm.user_id
    WHERE nu.user_id = auth.uid() AND ntm.is_active = true
  )
);

-- Fix UPDATE policy with same join
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
  OR EXISTS (
    SELECT 1 FROM neoteam_team_members ntm
    JOIN neohub_users nu ON nu.id = ntm.user_id
    WHERE nu.user_id = auth.uid() AND ntm.is_active = true
  )
);
