-- Add deadline check columns for PRAZO-type appointments
ALTER TABLE public.ipromed_appointments
  ADD COLUMN IF NOT EXISTS doc_elaborated boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS doc_delivered boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS prazo_done boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS prazo_filed boolean NOT NULL DEFAULT false;