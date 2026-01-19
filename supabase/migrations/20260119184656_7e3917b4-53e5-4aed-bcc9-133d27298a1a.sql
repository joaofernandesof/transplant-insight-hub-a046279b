-- Add new columns for enhanced lead management
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS procedure_interest text,
ADD COLUMN IF NOT EXISTS scheduled_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS discard_reason text;

-- Add comment for procedure_interest options
COMMENT ON COLUMN public.leads.procedure_interest IS 'Transplante Capilar, Transplante de Barba, Transplante de Sobrancelhas, Tratamento Capilar';

-- Update status enum comment to reflect new funnel stages
-- new = Lead Novo, contacted = Lead Captado, scheduled = Consulta Agendada, converted = Vendido, lost = Descartado
COMMENT ON COLUMN public.leads.status IS 'Funnel stages: new (Lead Novo), contacted (Lead Captado), scheduled (Consulta Agendada), converted (Vendido), lost (Descartado)';