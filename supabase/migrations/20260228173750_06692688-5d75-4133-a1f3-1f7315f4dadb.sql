
-- Add new columns for dual-flow pipeline
ALTER TABLE public.rh_vagas 
  ADD COLUMN IF NOT EXISTS tipo_fluxo TEXT NOT NULL DEFAULT 'express',
  ADD COLUMN IF NOT EXISTS perguntas_eliminatorias JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS checklist_onboarding JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS motivos_reprovacao JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS etapa_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS etapa_history JSONB DEFAULT '[]'::jsonb;

-- Update existing vagas to default express flow
UPDATE public.rh_vagas SET tipo_fluxo = 'express' WHERE tipo_fluxo IS NULL;
