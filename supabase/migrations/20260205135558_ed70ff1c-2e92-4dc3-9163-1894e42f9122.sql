-- Add document fields to followup rules
ALTER TABLE public.avivar_followup_rules
ADD COLUMN IF NOT EXISTS document_url TEXT,
ADD COLUMN IF NOT EXISTS document_name TEXT;