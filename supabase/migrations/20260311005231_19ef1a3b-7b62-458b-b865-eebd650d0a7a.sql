
-- Add workflow columns to ipromed_payables
ALTER TABLE public.ipromed_payables 
  ADD COLUMN IF NOT EXISTS workflow_stage TEXT NOT NULL DEFAULT 'solicitacao_pendente',
  ADD COLUMN IF NOT EXISTS is_urgent BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS requester_name TEXT,
  ADD COLUMN IF NOT EXISTS requester_department TEXT,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS pending_reason TEXT,
  ADD COLUMN IF NOT EXISTS bank_data TEXT,
  ADD COLUMN IF NOT EXISTS approved_by TEXT,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- Update existing records to 'pago' stage if already paid
UPDATE public.ipromed_payables SET workflow_stage = 'pago' WHERE status = 'pago';
UPDATE public.ipromed_payables SET workflow_stage = 'validacao_financeira' WHERE status = 'pendente';
UPDATE public.ipromed_payables SET workflow_stage = 'validacao_financeira' WHERE status = 'vencido';
