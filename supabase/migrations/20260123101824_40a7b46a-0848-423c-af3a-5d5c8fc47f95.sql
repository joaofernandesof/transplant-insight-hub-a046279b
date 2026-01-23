-- Ativar randomização para todas as provas existentes
UPDATE public.exams 
SET shuffle_questions = true, shuffle_options = true 
WHERE shuffle_questions = false OR shuffle_options = false OR shuffle_questions IS NULL OR shuffle_options IS NULL;

-- Alterar o valor padrão das colunas para que novas provas já venham com randomização ativada
ALTER TABLE public.exams ALTER COLUMN shuffle_questions SET DEFAULT true;
ALTER TABLE public.exams ALTER COLUMN shuffle_options SET DEFAULT true;