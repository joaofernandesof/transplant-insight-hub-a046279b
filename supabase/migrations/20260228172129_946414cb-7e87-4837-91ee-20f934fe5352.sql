
-- Expand rh_vagas with full Job Description fields and hiring pipeline
ALTER TABLE public.rh_vagas 
  ADD COLUMN IF NOT EXISTS empresa text DEFAULT 'TODAS',
  ADD COLUMN IF NOT EXISTS modalidade text DEFAULT 'presencial',
  ADD COLUMN IF NOT EXISTS salario_fixo numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tem_comissao boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS modelo_contratacao text DEFAULT 'cnpj',
  ADD COLUMN IF NOT EXISTS objetivo text,
  ADD COLUMN IF NOT EXISTS responsabilidades text,
  ADD COLUMN IF NOT EXISTS competencias text,
  ADD COLUMN IF NOT EXISTS formacao text,
  ADD COLUMN IF NOT EXISTS situacao text DEFAULT 'pendente_abertura',
  ADD COLUMN IF NOT EXISTS etapa_kanban text DEFAULT 'pendente_abertura',
  ADD COLUMN IF NOT EXISTS candidatos_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS responsavel text,
  ADD COLUMN IF NOT EXISTS data_limite date,
  ADD COLUMN IF NOT EXISTS prioridade text DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS observacoes text;
