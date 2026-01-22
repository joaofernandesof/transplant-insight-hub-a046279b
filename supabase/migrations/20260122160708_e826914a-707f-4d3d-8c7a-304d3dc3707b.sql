-- Drop permissive policies and create more restrictive ones
DROP POLICY IF EXISTS "Authenticated users can update announcements" ON public.announcements;
DROP POLICY IF EXISTS "Authenticated users can delete announcements" ON public.announcements;

-- Only creator can update their announcements
CREATE POLICY "Creator can update own announcements"
ON public.announcements
FOR UPDATE
TO authenticated
USING (auth.uid() = created_by);

-- Only creator can delete their announcements
CREATE POLICY "Creator can delete own announcements"
ON public.announcements
FOR DELETE
TO authenticated
USING (auth.uid() = created_by);