
-- Drop and recreate SELECT policy for neoacademy_student_profiles to include is_neohub_admin check
DROP POLICY IF EXISTS "Members can read student profiles" ON public.neoacademy_student_profiles;

CREATE POLICY "Members can read student profiles" ON public.neoacademy_student_profiles
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM neoacademy_account_members m
    WHERE m.account_id = neoacademy_student_profiles.account_id
    AND m.user_id = auth.uid() AND m.is_active = true
  )
  OR is_neohub_admin(auth.uid())
);

-- Also update ALL policy to use is_neohub_admin
DROP POLICY IF EXISTS "Admins can manage student profiles" ON public.neoacademy_student_profiles;

CREATE POLICY "Admins can manage student profiles" ON public.neoacademy_student_profiles
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM neoacademy_account_members m
    WHERE m.account_id = neoacademy_student_profiles.account_id
    AND m.user_id = auth.uid()
    AND m.role IN ('owner', 'admin') AND m.is_active = true
  )
  OR is_neohub_admin(auth.uid())
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM neoacademy_account_members m
    WHERE m.account_id = neoacademy_student_profiles.account_id
    AND m.user_id = auth.uid()
    AND m.role IN ('owner', 'admin') AND m.is_active = true
  )
  OR is_neohub_admin(auth.uid())
);

-- Also fix neoacademy_profile_courses policies to allow admin access
DROP POLICY IF EXISTS "Admins can manage profile courses" ON public.neoacademy_profile_courses;
DROP POLICY IF EXISTS "Members can read profile courses" ON public.neoacademy_profile_courses;

CREATE POLICY "Members can read profile courses" ON public.neoacademy_profile_courses
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM neoacademy_student_profiles sp
    JOIN neoacademy_account_members m ON m.account_id = sp.account_id
    WHERE sp.id = neoacademy_profile_courses.profile_id
    AND m.user_id = auth.uid() AND m.is_active = true
  )
  OR is_neohub_admin(auth.uid())
);

CREATE POLICY "Admins can manage profile courses" ON public.neoacademy_profile_courses
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM neoacademy_student_profiles sp
    JOIN neoacademy_account_members m ON m.account_id = sp.account_id
    WHERE sp.id = neoacademy_profile_courses.profile_id
    AND m.user_id = auth.uid()
    AND m.role IN ('owner', 'admin') AND m.is_active = true
  )
  OR is_neohub_admin(auth.uid())
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM neoacademy_student_profiles sp
    JOIN neoacademy_account_members m ON m.account_id = sp.account_id
    WHERE sp.id = neoacademy_profile_courses.profile_id
    AND m.user_id = auth.uid()
    AND m.role IN ('owner', 'admin') AND m.is_active = true
  )
  OR is_neohub_admin(auth.uid())
);
