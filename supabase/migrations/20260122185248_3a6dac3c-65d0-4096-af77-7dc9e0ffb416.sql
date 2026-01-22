-- Enable RLS on the view and add policy for authenticated users to read questions
-- Views inherit RLS from underlying tables, but we need to ensure the view has its own access

-- Create a secure database function to validate answers server-side
-- This will be called from an edge function
CREATE OR REPLACE FUNCTION public.validate_exam_answer(
  p_question_id UUID,
  p_selected_answer TEXT,
  p_attempt_id UUID
)
RETURNS TABLE(
  is_correct BOOLEAN,
  points_earned INTEGER,
  points_total INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $fn$
DECLARE
  v_correct_answer TEXT;
  v_points INTEGER;
  v_user_id UUID;
  v_attempt_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  SELECT user_id INTO v_attempt_user_id
  FROM exam_attempts
  WHERE id = p_attempt_id;
  
  IF v_attempt_user_id IS NULL OR v_attempt_user_id != v_user_id THEN
    RAISE EXCEPTION 'Invalid attempt ID or unauthorized access';
  END IF;
  
  SELECT eq.correct_answer, eq.points 
  INTO v_correct_answer, v_points
  FROM exam_questions eq
  WHERE eq.id = p_question_id;
  
  IF v_correct_answer IS NULL THEN
    RAISE EXCEPTION 'Question not found';
  END IF;
  
  RETURN QUERY SELECT 
    (p_selected_answer = v_correct_answer) AS is_correct,
    CASE WHEN p_selected_answer = v_correct_answer THEN v_points ELSE 0 END AS points_earned,
    v_points AS points_total;
END;
$fn$;

GRANT EXECUTE ON FUNCTION public.validate_exam_answer(UUID, TEXT, UUID) TO authenticated;

-- Create function to get exam results with answers (only after submission)
CREATE OR REPLACE FUNCTION public.get_exam_results_with_answers(p_attempt_id UUID)
RETURNS TABLE(
  question_id UUID,
  question_text TEXT,
  selected_answer TEXT,
  correct_answer TEXT,
  is_correct BOOLEAN,
  points_earned INTEGER,
  explanation TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $fn$
DECLARE
  v_user_id UUID;
  v_attempt_status TEXT;
  v_attempt_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  SELECT ea.user_id, ea.status
  INTO v_attempt_user_id, v_attempt_status
  FROM exam_attempts ea
  WHERE ea.id = p_attempt_id;
  
  IF v_attempt_user_id IS NULL OR 
     (v_attempt_user_id != v_user_id AND NOT has_role(v_user_id, 'admin'::app_role)) THEN
    RAISE EXCEPTION 'Unauthorized access to exam results';
  END IF;
  
  IF v_attempt_status != 'submitted' AND NOT has_role(v_user_id, 'admin'::app_role) THEN
    RAISE EXCEPTION 'Exam not yet submitted';
  END IF;
  
  RETURN QUERY
  SELECT 
    eq.id AS question_id,
    eq.question_text,
    ans.selected_answer,
    eq.correct_answer,
    ans.is_correct,
    COALESCE(ans.points_earned, 0) AS points_earned,
    eq.explanation
  FROM exam_questions eq
  LEFT JOIN exam_answers ans ON ans.question_id = eq.id AND ans.attempt_id = p_attempt_id
  WHERE eq.exam_id = (SELECT exam_id FROM exam_attempts WHERE id = p_attempt_id)
  ORDER BY eq.order_index;
END;
$fn$;

GRANT EXECUTE ON FUNCTION public.get_exam_results_with_answers(UUID) TO authenticated;