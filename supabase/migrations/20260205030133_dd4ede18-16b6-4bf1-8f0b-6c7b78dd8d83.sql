
-- Create sequence for unique lead codes (global across all accounts)
CREATE SEQUENCE IF NOT EXISTS lead_code_seq START 1;

-- Add lead_code column to avivar_kanban_leads
ALTER TABLE public.avivar_kanban_leads
ADD COLUMN IF NOT EXISTS lead_code VARCHAR(10) UNIQUE;

-- Add lead_code column to leads table (NeoHub)
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS lead_code VARCHAR(10) UNIQUE;

-- Function to generate lead code in format L00001
CREATE OR REPLACE FUNCTION public.generate_lead_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code TEXT;
  v_num INTEGER;
BEGIN
  v_num := nextval('lead_code_seq');
  v_code := 'L' || LPAD(v_num::TEXT, 5, '0');
  RETURN v_code;
END;
$$;

-- Trigger function for avivar_kanban_leads
CREATE OR REPLACE FUNCTION public.set_avivar_lead_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.lead_code IS NULL THEN
    NEW.lead_code := public.generate_lead_code();
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger function for leads table
CREATE OR REPLACE FUNCTION public.set_lead_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.lead_code IS NULL THEN
    NEW.lead_code := public.generate_lead_code();
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for avivar_kanban_leads
DROP TRIGGER IF EXISTS trigger_set_avivar_lead_code ON public.avivar_kanban_leads;
CREATE TRIGGER trigger_set_avivar_lead_code
  BEFORE INSERT ON public.avivar_kanban_leads
  FOR EACH ROW
  EXECUTE FUNCTION public.set_avivar_lead_code();

-- Create trigger for leads table
DROP TRIGGER IF EXISTS trigger_set_lead_code ON public.leads;
CREATE TRIGGER trigger_set_lead_code
  BEFORE INSERT ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.set_lead_code();

-- Backfill existing records in avivar_kanban_leads
UPDATE public.avivar_kanban_leads
SET lead_code = public.generate_lead_code()
WHERE lead_code IS NULL;

-- Backfill existing records in leads table
UPDATE public.leads
SET lead_code = public.generate_lead_code()
WHERE lead_code IS NULL;

-- Make lead_code NOT NULL after backfill
ALTER TABLE public.avivar_kanban_leads
ALTER COLUMN lead_code SET NOT NULL;

ALTER TABLE public.leads
ALTER COLUMN lead_code SET NOT NULL;
