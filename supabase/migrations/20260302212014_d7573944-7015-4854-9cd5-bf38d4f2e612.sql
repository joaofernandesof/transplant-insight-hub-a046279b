
-- Create audit log table for clinic surgeries
CREATE TABLE public.clinic_surgery_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  surgery_id UUID NOT NULL REFERENCES public.clinic_surgeries(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  user_name TEXT,
  action TEXT NOT NULL DEFAULT 'updated',
  field_name TEXT,
  field_label TEXT,
  old_value TEXT,
  new_value TEXT,
  changes JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.clinic_surgery_audit_log ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read logs
CREATE POLICY "Authenticated users can read surgery audit logs"
ON public.clinic_surgery_audit_log
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to insert logs
CREATE POLICY "Authenticated users can insert surgery audit logs"
ON public.clinic_surgery_audit_log
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Index for fast lookups by surgery
CREATE INDEX idx_clinic_surgery_audit_log_surgery_id ON public.clinic_surgery_audit_log(surgery_id);
CREATE INDEX idx_clinic_surgery_audit_log_created_at ON public.clinic_surgery_audit_log(created_at DESC);
