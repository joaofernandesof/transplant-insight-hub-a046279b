-- Allow students to view all enrollments from classes they are enrolled in
CREATE POLICY "Students can view classmates enrollments"
ON public.class_enrollments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.class_enrollments ce
    WHERE ce.class_id = class_enrollments.class_id
      AND ce.user_id = auth.uid()
  )
);