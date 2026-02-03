-- Add new fields for complete legal case registration (Astrea-style)
ALTER TABLE public.ipromed_legal_cases 
ADD COLUMN IF NOT EXISTS folder TEXT,
ADD COLUMN IF NOT EXISTS client_qualification TEXT,
ADD COLUMN IF NOT EXISTS other_parties JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS instance TEXT,
ADD COLUMN IF NOT EXISTS court_link TEXT,
ADD COLUMN IF NOT EXISTS judge_number TEXT,
ADD COLUMN IF NOT EXISTS court_branch TEXT,
ADD COLUMN IF NOT EXISTS forum TEXT,
ADD COLUMN IF NOT EXISTS action_type TEXT,
ADD COLUMN IF NOT EXISTS case_object TEXT,
ADD COLUMN IF NOT EXISTS case_value NUMERIC,
ADD COLUMN IF NOT EXISTS distribution_date DATE,
ADD COLUMN IF NOT EXISTS condemnation_value NUMERIC,
ADD COLUMN IF NOT EXISTS access_type TEXT DEFAULT 'public',
ADD COLUMN IF NOT EXISTS label TEXT,
ADD COLUMN IF NOT EXISTS responsible_name TEXT,
ADD COLUMN IF NOT EXISTS observations TEXT;