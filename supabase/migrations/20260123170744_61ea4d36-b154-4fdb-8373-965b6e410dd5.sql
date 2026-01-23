
-- Drop existing function
DROP FUNCTION IF EXISTS public.validate_exam_answer(uuid, text, uuid);

-- Create improved function that validates by comparing answer text
-- The p_selected_answer now receives the actual answer TEXT, not just the letter
CREATE OR REPLACE FUNCTION public.validate_exam_answer(
  p_question_id uuid, 
  p_selected_answer text, 
  p_attempt_id uuid
)
RETURNS TABLE(is_correct boolean, points_earned integer, points_total integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_correct_answer_letter TEXT;
  v_correct_answer_text TEXT;
  v_points INTEGER;
  v_options JSONB;
  v_user_id UUID;
  v_attempt_user_id UUID;
  v_letter_index INTEGER;
BEGIN
  v_user_id := auth.uid();
  
  -- Validate attempt ownership
  SELECT user_id INTO v_attempt_user_id
  FROM exam_attempts
  WHERE id = p_attempt_id;
  
  IF v_attempt_user_id IS NULL OR v_attempt_user_id != v_user_id THEN
    RAISE EXCEPTION 'Invalid attempt ID or unauthorized access';
  END IF;
  
  -- Get question data
  SELECT eq.correct_answer, eq.points, eq.options 
  INTO v_correct_answer_letter, v_points, v_options
  FROM exam_questions eq
  WHERE eq.id = p_question_id;
  
  IF v_correct_answer_letter IS NULL THEN
    RAISE EXCEPTION 'Question not found';
  END IF;
  
  -- Convert letter (A, B, C, D, E) to index (0, 1, 2, 3, 4)
  v_letter_index := ASCII(UPPER(v_correct_answer_letter)) - ASCII('A');
  
  -- Get the correct answer text from options array
  v_correct_answer_text := v_options->>v_letter_index;
  
  -- Compare the selected answer TEXT with the correct answer TEXT
  -- This works regardless of option order/shuffling
  RETURN QUERY SELECT 
    (TRIM(p_selected_answer) = TRIM(v_correct_answer_text)) AS is_correct,
    CASE WHEN TRIM(p_selected_answer) = TRIM(v_correct_answer_text) THEN COALESCE(v_points, 1) ELSE 0 END AS points_earned,
    COALESCE(v_points, 1) AS points_total;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.validate_exam_answer(uuid, text, uuid) TO authenticated;
