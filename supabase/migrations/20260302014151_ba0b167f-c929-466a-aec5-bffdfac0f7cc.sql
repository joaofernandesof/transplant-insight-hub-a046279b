-- Add 'retencao' to journey type enum
ALTER TYPE public.avivar_journey_type ADD VALUE IF NOT EXISTS 'retencao';

-- Add retention stages to avivar_stage enum
ALTER TYPE public.avivar_stage ADD VALUE IF NOT EXISTS 'solicitacao_cancelamento';
ALTER TYPE public.avivar_stage ADD VALUE IF NOT EXISTS 'analise_motivo';
ALTER TYPE public.avivar_stage ADD VALUE IF NOT EXISTS 'negociacao_retencao';
ALTER TYPE public.avivar_stage ADD VALUE IF NOT EXISTS 'oferta_retencao';
ALTER TYPE public.avivar_stage ADD VALUE IF NOT EXISTS 'decisao_final';
ALTER TYPE public.avivar_stage ADD VALUE IF NOT EXISTS 'retido';
ALTER TYPE public.avivar_stage ADD VALUE IF NOT EXISTS 'nao_retido';

-- Add retention fields to avivar_patient_journeys
ALTER TABLE public.avivar_patient_journeys 
  ADD COLUMN IF NOT EXISTS cancellation_reason text,
  ADD COLUMN IF NOT EXISTS cancellation_details text,
  ADD COLUMN IF NOT EXISTS retention_attempt_done boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS retention_attempt_notes text,
  ADD COLUMN IF NOT EXISTS retention_offer_type text,
  ADD COLUMN IF NOT EXISTS retention_offer_details text,
  ADD COLUMN IF NOT EXISTS retention_offer_accepted boolean,
  ADD COLUMN IF NOT EXISTS final_decision text CHECK (final_decision IN ('retido', 'nao_retido')),
  ADD COLUMN IF NOT EXISTS final_decision_notes text,
  ADD COLUMN IF NOT EXISTS retention_origin_stage text,
  ADD COLUMN IF NOT EXISTS linked_ticket_id uuid;