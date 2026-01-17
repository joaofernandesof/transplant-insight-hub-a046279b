-- Add claim and conversion fields to leads table
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS claimed_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS claimed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS available_at timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS converted_value numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS procedures_sold text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS converted_at timestamp with time zone;

-- Create index for faster queries on claimed leads
CREATE INDEX IF NOT EXISTS idx_leads_claimed_by ON public.leads(claimed_by);
CREATE INDEX IF NOT EXISTS idx_leads_available_at ON public.leads(available_at);
CREATE INDEX IF NOT EXISTS idx_leads_state ON public.leads(state);

-- Update RLS policy for leads - licensees can only see unclaimed leads or their own claimed leads
DROP POLICY IF EXISTS "Clinics can view their own leads" ON public.leads;

CREATE POLICY "Users can view available or own leads" 
ON public.leads 
FOR SELECT 
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR claimed_by = auth.uid()
  OR (claimed_by IS NULL)
);

-- Update policy for updating leads - users can only update leads they claimed
DROP POLICY IF EXISTS "Clinics can update their own leads" ON public.leads;

CREATE POLICY "Users can update their claimed leads" 
ON public.leads 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR claimed_by = auth.uid()
  OR (claimed_by IS NULL AND status = 'new')
);

-- Allow users to claim leads (insert claim info)
CREATE POLICY "Users can claim available leads" 
ON public.leads 
FOR UPDATE 
USING (
  claimed_by IS NULL 
  AND (
    -- State match within 1 hour
    (available_at > now() - interval '1 hour' AND state IN (
      SELECT p.state FROM public.profiles p WHERE p.user_id = auth.uid()
    ))
    OR 
    -- Any user after 1 hour
    (available_at <= now() - interval '1 hour')
  )
)
WITH CHECK (claimed_by = auth.uid());