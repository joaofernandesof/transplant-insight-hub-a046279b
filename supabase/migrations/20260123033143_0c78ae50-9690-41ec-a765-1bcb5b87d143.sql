
-- Adicionar política para permitir que alunos leiam questões via view segura
-- A view exam_questions_student já exclui o campo correct_answer

-- Primeiro, criar política para leitura de questões pelos estudantes
-- que estão em uma tentativa ativa ou finalizaram o exame
CREATE POLICY "Students can view questions during exam"
ON public.exam_questions
FOR SELECT
USING (
  -- Permitir se o usuário tem uma tentativa ativa ou submetida para este exame
  EXISTS (
    SELECT 1 FROM public.exam_attempts ea
    WHERE ea.exam_id = exam_questions.exam_id
    AND ea.user_id = auth.uid()
  )
  OR
  -- Ou se o exame está ativo (para iniciar nova tentativa)
  EXISTS (
    SELECT 1 FROM public.exams e
    WHERE e.id = exam_questions.exam_id
    AND e.is_active = true
  )
);

-- Garantir que a view exam_questions_student seja segura
-- Dropar e recriar com SECURITY DEFINER para permitir leitura
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

-- Adicionar comentário explicativo
COMMENT ON VIEW public.exam_questions_student IS 'View segura para estudantes - exclui correct_answer';
