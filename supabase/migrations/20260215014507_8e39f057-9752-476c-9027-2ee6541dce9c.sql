-- Add lead outcome column for tracking: vendido, descartado, em_atendimento
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS lead_outcome text DEFAULT NULL;

-- Add outcome timestamp
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS outcome_at timestamp with time zone DEFAULT NULL;

-- Add index for queries filtering by outcome
CREATE INDEX IF NOT EXISTS idx_leads_lead_outcome ON public.leads (lead_outcome) WHERE lead_outcome IS NOT NULL;

-- Add comment
COMMENT ON COLUMN public.leads.lead_outcome IS 'Lead outcome set by licensee: vendido, descartado, em_atendimento';
COMMENT ON COLUMN public.leads.outcome_at IS 'Timestamp when the outcome was set';