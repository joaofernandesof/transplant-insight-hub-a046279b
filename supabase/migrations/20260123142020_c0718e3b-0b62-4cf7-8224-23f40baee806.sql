-- Fix infinite recursion in class_enrollments RLS policy
-- The policy "Students can view classmates enrollments" causes infinite recursion

-- Drop the problematic policy
DROP POLICY IF EXISTS "Students can view classmates enrollments" ON public.class_enrollments;

-- Create a security definer function to check if user is enrolled in any class
CREATE OR REPLACE FUNCTION public.user_has_any_enrollment(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.class_enrollments
    WHERE user_id = _user_id
  )
$$;

-- Create a security definer function to get all enrolled user_ids
CREATE OR REPLACE FUNCTION public.get_all_enrolled_user_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT user_id FROM public.class_enrollments
$$;

-- Recreate the policy using security definer function
-- Students who are enrolled can view ALL enrollments (for community feature)
CREATE POLICY "Students can view all enrollments if enrolled"
ON public.class_enrollments
FOR SELECT
TO authenticated
USING (
  public.user_has_any_enrollment(auth.uid())
);

-- Also fix the profiles policy to allow enrolled students to see all enrolled student profiles
DROP POLICY IF EXISTS "Students can view other enrolled students profiles" ON public.profiles;

-- Recreate profiles policy - enrolled students can see all enrolled students
CREATE POLICY "Enrolled students can view all enrolled students"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() 
  OR 
  (public.user_has_any_enrollment(auth.uid()) AND user_id IN (SELECT public.get_all_enrolled_user_ids()))
);