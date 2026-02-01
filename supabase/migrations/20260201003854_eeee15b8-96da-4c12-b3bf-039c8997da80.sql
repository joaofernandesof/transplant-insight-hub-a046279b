-- Add business_units column to avivar_agents table for multiple locations support
ALTER TABLE public.avivar_agents
ADD COLUMN IF NOT EXISTS business_units jsonb DEFAULT '[]'::jsonb;

-- Add comment
COMMENT ON COLUMN public.avivar_agents.business_units IS 'Array of business units/branches with name, city, state, address, phone';