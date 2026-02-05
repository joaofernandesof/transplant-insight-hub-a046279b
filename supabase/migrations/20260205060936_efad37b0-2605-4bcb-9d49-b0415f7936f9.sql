-- Create table for HotLeads captures (leads from landing pages)
CREATE TABLE public.hotleads_captures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  city TEXT NOT NULL,
  email TEXT,
  quiz_answers JSONB,
  source TEXT NOT NULL DEFAULT 'landing',
  status TEXT NOT NULL DEFAULT 'new',
  assigned_to UUID,
  assigned_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.hotleads_captures ENABLE ROW LEVEL SECURITY;

-- Policy for inserting (public - anyone can submit a lead without authentication)
CREATE POLICY "Anyone can submit leads"
ON public.hotleads_captures
FOR INSERT
WITH CHECK (true);

-- Policy for reading (authenticated users with admin portal access)
CREATE POLICY "Admins can read all leads"
ON public.hotleads_captures
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.neohub_users 
    WHERE neohub_users.user_id = auth.uid() 
    AND 'admin' = ANY(neohub_users.allowed_portals)
  )
);

-- Policy for updating (authenticated users with admin portal access)
CREATE POLICY "Admins can update leads"
ON public.hotleads_captures
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.neohub_users 
    WHERE neohub_users.user_id = auth.uid() 
    AND 'admin' = ANY(neohub_users.allowed_portals)
  )
);

-- Index for faster queries
CREATE INDEX idx_hotleads_captures_status ON public.hotleads_captures(status);
CREATE INDEX idx_hotleads_captures_city ON public.hotleads_captures(city);
CREATE INDEX idx_hotleads_captures_created_at ON public.hotleads_captures(created_at DESC);