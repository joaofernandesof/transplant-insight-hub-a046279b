-- =====================================================
-- SECURITY FIX 1: Exam Questions Answer Protection
-- Create a secure view that hides correct_answer from students
-- =====================================================

-- Create a view that students can use (without correct_answer)
CREATE OR REPLACE VIEW public.exam_questions_student AS
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