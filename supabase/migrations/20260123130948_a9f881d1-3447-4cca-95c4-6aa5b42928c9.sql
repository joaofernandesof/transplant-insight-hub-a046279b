
-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Users can view active classes" ON public.course_classes;

-- Create a new policy that allows viewing classes with various active statuses
-- This includes: active, in_progress, confirmed (all statuses that students should see)
CREATE POLICY "Users can view available classes" 
ON public.course_classes 
FOR SELECT 
USING (
  status IN ('active', 'in_progress', 'confirmed', 'pending') 
  OR has_role(auth.uid(), 'admin'::app_role)
);
