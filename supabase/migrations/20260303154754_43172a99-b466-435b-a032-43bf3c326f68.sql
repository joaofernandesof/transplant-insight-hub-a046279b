
-- Add public_token to form templates for public access links
ALTER TABLE public.ipromed_form_templates 
ADD COLUMN IF NOT EXISTS public_token TEXT UNIQUE DEFAULT gen_random_uuid()::text;

-- Create table to store public form submissions (no auth required)
CREATE TABLE IF NOT EXISTS public.ipromed_public_form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.ipromed_form_templates(id) ON DELETE CASCADE,
  respondent_name TEXT,
  respondent_email TEXT,
  answers JSONB NOT NULL DEFAULT '{}',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ipromed_public_form_submissions ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (public form submissions)
CREATE POLICY "Allow anonymous inserts on public form submissions"
ON public.ipromed_public_form_submissions
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow authenticated users to read submissions
CREATE POLICY "Authenticated users can read form submissions"
ON public.ipromed_public_form_submissions
FOR SELECT
TO authenticated
USING (true);

-- Allow anon to read form templates by public_token (needed for public page)
CREATE POLICY "Allow anon to read templates by public_token"
ON public.ipromed_form_templates
FOR SELECT
TO anon
USING (public_token IS NOT NULL AND is_active = true);
