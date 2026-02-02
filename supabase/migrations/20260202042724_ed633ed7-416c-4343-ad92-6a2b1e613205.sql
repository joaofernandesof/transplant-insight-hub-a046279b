-- Adicionar campo de instrução para IA nas colunas do Kanban
ALTER TABLE public.avivar_kanban_columns
ADD COLUMN IF NOT EXISTS ai_instruction TEXT;

-- Comentário explicativo
COMMENT ON COLUMN public.avivar_kanban_columns.ai_instruction IS 'Instrução para a IA saber quando mover leads para esta coluna. Ex: "Mova para cá quando o lead cancelar o agendamento"';