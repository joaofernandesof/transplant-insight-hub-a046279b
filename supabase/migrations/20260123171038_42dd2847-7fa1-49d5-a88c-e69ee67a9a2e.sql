
-- Revalidate all existing exam answers using the correct logic
-- This compares the selected_answer TEXT with the actual correct answer TEXT from options array

-- Step 1: Update is_correct and points_earned for each answer
UPDATE exam_answers ea
SET 
  is_correct = (
    TRIM(ea.selected_answer) = TRIM(
      eq.options->>( ASCII(UPPER(eq.correct_answer)) - ASCII('A') )
    )
  ),
  points_earned = CASE 
    WHEN TRIM(ea.selected_answer) = TRIM(
      eq.options->>( ASCII(UPPER(eq.correct_answer)) - ASCII('A') )
    ) 
    THEN COALESCE(eq.points, 1) 
    ELSE 0 
  END
FROM exam_questions eq
WHERE ea.question_id = eq.id;

-- Step 2: Recalculate scores for all submitted attempts
UPDATE exam_attempts att
SET 
  earned_points = sub.total_earned,
  total_points = sub.total_possible,
  score = CASE 
    WHEN sub.total_possible > 0 
    THEN (sub.total_earned::numeric / sub.total_possible::numeric) * 100 
    ELSE 0 
  END,
  status = CASE 
    WHEN att.submitted_at IS NOT NULL THEN 'submitted'
    ELSE att.status
  END
FROM (
  SELECT 
    ans.attempt_id,
    SUM(COALESCE(ans.points_earned, 0)) as total_earned,
    SUM(COALESCE(eq.points, 1)) as total_possible
  FROM exam_answers ans
  JOIN exam_questions eq ON eq.id = ans.question_id
  GROUP BY ans.attempt_id
) sub
WHERE att.id = sub.attempt_id
  AND att.submitted_at IS NOT NULL;
