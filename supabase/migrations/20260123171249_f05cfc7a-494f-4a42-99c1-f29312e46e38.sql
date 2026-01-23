
-- Revalidate all existing exam answers - comparing letter with letter
-- Since old answers were saved as letters (A, B, C, D, E)

UPDATE exam_answers ea
SET 
  is_correct = (UPPER(TRIM(ea.selected_answer)) = UPPER(TRIM(eq.correct_answer))),
  points_earned = CASE 
    WHEN UPPER(TRIM(ea.selected_answer)) = UPPER(TRIM(eq.correct_answer))
    THEN COALESCE(eq.points, 1) 
    ELSE 0 
  END
FROM exam_questions eq
WHERE ea.question_id = eq.id;

-- Recalculate scores for all submitted attempts
UPDATE exam_attempts att
SET 
  earned_points = sub.total_earned,
  total_points = sub.total_possible,
  score = CASE 
    WHEN sub.total_possible > 0 
    THEN ROUND((sub.total_earned::numeric / sub.total_possible::numeric) * 100, 2)
    ELSE 0 
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
