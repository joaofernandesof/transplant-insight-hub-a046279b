
-- Drop old restrictive policies
DROP POLICY IF EXISTS "Members can view published modules" ON neoacademy_modules;
DROP POLICY IF EXISTS "Members can view published lessons" ON neoacademy_lessons;

-- Allow anyone authenticated to view published modules/lessons
CREATE POLICY "Anyone can view published modules"
ON neoacademy_modules FOR SELECT TO authenticated
USING (is_published = true OR is_neoacademy_admin(auth.uid(), account_id));

CREATE POLICY "Anyone can view published lessons"
ON neoacademy_lessons FOR SELECT TO authenticated
USING (is_published = true OR is_neoacademy_admin(auth.uid(), account_id));
