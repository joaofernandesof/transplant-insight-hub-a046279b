
-- Adicionar colunas de etapas de cobrança na tabela existente
ALTER TABLE public.neopay_delinquency
  ADD COLUMN IF NOT EXISTS collection_stage TEXT NOT NULL DEFAULT 'late',
  ADD COLUMN IF NOT EXISTS serasa_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS serasa_notes TEXT,
  ADD COLUMN IF NOT EXISTS spc_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS spc_notes TEXT,
  ADD COLUMN IF NOT EXISTS protesto_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS protesto_notes TEXT,
  ADD COLUMN IF NOT EXISTS processo_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS processo_notes TEXT,
  ADD COLUMN IF NOT EXISTS processo_number TEXT;

-- Add constraint for valid stages
ALTER TABLE public.neopay_delinquency
  ADD CONSTRAINT chk_collection_stage CHECK (collection_stage IN ('late', 'serasa', 'spc', 'protesto', 'processo', 'recovered'));
