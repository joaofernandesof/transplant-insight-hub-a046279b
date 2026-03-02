
-- Fix surgery_tasks SELECT policy to include NeoTeam members
DROP POLICY IF EXISTS "Staff can view surgery tasks" ON public.surgery_tasks;
CREATE POLICY "Staff and NeoTeam can view surgery tasks"
ON public.surgery_tasks
FOR SELECT
USING (
  is_neohub_admin(auth.uid())
  OR (EXISTS (
    SELECT 1 FROM staff_profiles
    WHERE staff_profiles.user_id = auth.uid() AND staff_profiles.is_active = true
  ))
  OR (EXISTS (
    SELECT 1 FROM neoteam_team_members ntm
    WHERE ntm.user_id = auth.uid() AND ntm.is_active = true
  ))
);

-- Fix surgery_tasks UPDATE policy to include NeoTeam members
DROP POLICY IF EXISTS "Staff can update surgery tasks" ON public.surgery_tasks;
CREATE POLICY "Staff and NeoTeam can update surgery tasks"
ON public.surgery_tasks
FOR UPDATE
USING (
  is_neohub_admin(auth.uid())
  OR (EXISTS (
    SELECT 1 FROM staff_profiles
    WHERE staff_profiles.user_id = auth.uid() AND staff_profiles.is_active = true
  ))
  OR (EXISTS (
    SELECT 1 FROM neoteam_team_members ntm
    WHERE ntm.user_id = auth.uid() AND ntm.is_active = true
  ))
);

-- Fix surgery_task_definitions SELECT policy to include NeoTeam members
DROP POLICY IF EXISTS "Staff can view task definitions" ON public.surgery_task_definitions;
CREATE POLICY "Staff and NeoTeam can view task definitions"
ON public.surgery_task_definitions
FOR SELECT
USING (
  is_neohub_admin(auth.uid())
  OR (EXISTS (
    SELECT 1 FROM staff_profiles
    WHERE staff_profiles.user_id = auth.uid() AND staff_profiles.is_active = true
  ))
  OR (EXISTS (
    SELECT 1 FROM neoteam_team_members ntm
    WHERE ntm.user_id = auth.uid() AND ntm.is_active = true
  ))
);
