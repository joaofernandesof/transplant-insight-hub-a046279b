
-- Drop existing select policies on leads table that might conflict
DROP POLICY IF EXISTS "Licensees can view available and own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can view available or own claimed leads" ON public.leads;
DROP POLICY IF EXISTS "Authenticated users can view available and own leads" ON public.leads;

-- Create policy: authenticated users can see available leads (claimed_by IS NULL) or their own claimed leads
CREATE POLICY "Authenticated users can view available and own leads"
ON public.leads
FOR SELECT
TO authenticated
USING (
  claimed_by IS NULL
  OR claimed_by = auth.uid()
);
