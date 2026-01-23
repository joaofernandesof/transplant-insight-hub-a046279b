-- Recalcular respostas e notas com base no TEXTO do gabarito (independente da ordem)
--
-- Regra:
-- - correct_text = options[correct_answer]
-- - selected_text =
--    * se selected_answer for letra (A-E): options[selected_answer]
--    * senão: selected_answer (texto)
-- - is_correct = selected_text == correct_text (case-insensitive + trim)

DO $$
BEGIN
  -- 1) Revalida cada resposta (exam_answers)
  WITH computed AS (
    SELECT
      ans.id AS answer_id,
      COALESCE(q.points, 1) AS q_points,
      q.options AS options,
      q.correct_answer AS correct_letter,
      ans.selected_answer AS selected_raw,
      -- correct_text (sempre pelo gabarito: letra -> texto)
      (q.options ->> (ASCII(UPPER(q.correct_answer)) - ASCII('A'))) AS correct_text,
      -- selected_text (tenta normalizar letra->texto, senão mantém texto)
      CASE
        WHEN ans.selected_answer IS NULL OR TRIM(ans.selected_answer) = '' THEN NULL
        WHEN ans.selected_answer ~ '^[A-Ea-e]$' THEN (q.options ->> (ASCII(UPPER(ans.selected_answer)) - ASCII('A')))
        ELSE ans.selected_answer
      END AS selected_text
    FROM public.exam_answers ans
    JOIN public.exam_questions q ON q.id = ans.question_id
    JOIN public.exam_attempts att ON att.id = ans.attempt_id
    WHERE att.status IN ('submitted', 'graded')
  )
  UPDATE public.exam_answers ans
  SET
    is_correct = (
      c.selected_text IS NOT NULL
      AND c.correct_text IS NOT NULL
      AND LOWER(TRIM(c.selected_text)) = LOWER(TRIM(c.correct_text))
    ),
    points_earned = CASE
      WHEN (
        c.selected_text IS NOT NULL
        AND c.correct_text IS NOT NULL
        AND LOWER(TRIM(c.selected_text)) = LOWER(TRIM(c.correct_text))
      ) THEN c.q_points
      ELSE 0
    END
  FROM computed c
  WHERE ans.id = c.answer_id;

  -- 2) Recalcula agregados por tentativa (exam_attempts)
  WITH agg AS (
    SELECT
      att.id AS attempt_id,
      SUM(COALESCE(ans.points_earned, 0))::INT AS earned_points,
      SUM(COALESCE(q.points, 1))::INT AS total_points
    FROM public.exam_attempts att
    JOIN public.exam_answers ans ON ans.attempt_id = att.id
    JOIN public.exam_questions q ON q.id = ans.question_id
    WHERE att.status IN ('submitted', 'graded')
    GROUP BY att.id
  )
  UPDATE public.exam_attempts att
  SET
    earned_points = agg.earned_points,
    total_points = agg.total_points,
    score = CASE
      WHEN agg.total_points > 0 THEN ROUND((agg.earned_points::NUMERIC / agg.total_points::NUMERIC) * 100, 2)
      ELSE 0
    END
  FROM agg
  WHERE att.id = agg.attempt_id;
END $$;
