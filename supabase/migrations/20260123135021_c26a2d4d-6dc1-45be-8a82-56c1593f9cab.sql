-- Allow authenticated users to view profiles of students enrolled in any class
-- This enables the Community feature where all students can see each other

-- First, drop any conflicting policy if it exists
DROP POLICY IF EXISTS "Students can view other enrolled students profiles" ON public.profiles;

-- Create policy to allow viewing profiles of enrolled students
CREATE POLICY "Students can view other enrolled students profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  -- User can always see their own profile
  user_id = auth.uid()
  OR
  -- Or see profiles of users enrolled in any class (community members)
  EXISTS (
    SELECT 1 FROM public.class_enrollments ce
    WHERE ce.user_id = profiles.user_id
  )
);