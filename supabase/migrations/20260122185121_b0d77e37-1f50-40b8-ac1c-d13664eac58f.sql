-- Fix the view to use SECURITY INVOKER (default) by recreating it
-- Drop and recreate to ensure proper security context
DROP VIEW IF EXISTS public.exam_questions_student;

CREATE VIEW public.exam_questions_student 
WITH (security_invoker = true)
AS
SELECT 
  id,
  exam_id,
  question_text,
  question_type,
  options,
  points,
  order_index,
  explanation,
  created_at
FROM public.exam_questions;

-- Grant SELECT on the view to authenticated users
GRANT SELECT ON public.exam_questions_student TO authenticated;

-- Update the RLS policy on exam_questions to ONLY allow admins to see correct_answer
-- First drop the existing student-facing policy
DROP POLICY IF EXISTS "Users can view questions of available exams" ON public.exam_questions;

-- Create new policy that ONLY allows admins to see exam_questions table directly
-- Students must use the view instead
CREATE POLICY "Only admins can access exam_questions directly" 
ON public.exam_questions 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));