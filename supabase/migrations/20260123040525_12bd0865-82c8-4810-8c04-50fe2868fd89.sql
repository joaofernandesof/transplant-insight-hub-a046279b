-- Allow admins to delete all exam_attempts
CREATE POLICY "Admins can delete all attempts" 
ON public.exam_attempts 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete all exam_answers
CREATE POLICY "Admins can delete all answers" 
ON public.exam_answers 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));